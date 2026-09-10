import { newId, nowIso } from "./index";

export type Note = {
  id: string;
  workspace_id: string;
  module_id: string | null;
  title: string;
  content_json: string;
  content_text: string;
  colour: string | null;
  is_pinned: number;
  current_version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type NoteVersion = {
  id: string;
  version: number;
  title: string;
  content_text: string;
  content_json: string;
  source: string;
  created_at: string;
};

export type NoteSource = "create" | "autosave" | "manual" | "restore";

const NOTE_COLUMNS =
  "id, workspace_id, module_id, title, content_json, content_text, colour, is_pinned, current_version, created_at, updated_at, deleted_at";

/**
 * A fresh snapshot into note_versions is only taken when the previous one is
 * older than this, or when the caller asks for it (source "manual" / "restore").
 * Keeps autosave from producing a version per keystroke pause while still
 * protecting against overwrite mistakes (MASTER.md — version restore).
 */
const SNAPSHOT_INTERVAL_MS = 2 * 60 * 1000;

function toContentJson(text: string): string {
  return JSON.stringify({ type: "plaintext", text });
}

export async function listNotes(
  db: D1Database,
  userId: string,
  workspaceId: string,
  opts: { deleted?: boolean } = {}
): Promise<Note[]> {
  const deletedClause = opts.deleted ? "deleted_at IS NOT NULL" : "deleted_at IS NULL";
  const order = opts.deleted ? "deleted_at DESC" : "is_pinned DESC, updated_at DESC";
  const { results } = await db
    .prepare(
      `SELECT ${NOTE_COLUMNS} FROM notes
       WHERE user_id = ? AND workspace_id = ? AND ${deletedClause}
       ORDER BY ${order}`
    )
    .bind(userId, workspaceId)
    .all<Note>();
  return results;
}

export async function getNote(
  db: D1Database,
  userId: string,
  id: string,
  opts: { includeDeleted?: boolean } = {}
): Promise<Note | null> {
  const clause = opts.includeDeleted ? "" : "AND deleted_at IS NULL";
  return db
    .prepare(`SELECT ${NOTE_COLUMNS} FROM notes WHERE id = ? AND user_id = ? ${clause}`)
    .bind(id, userId)
    .first<Note>();
}

export type NewNote = {
  workspaceId: string;
  moduleId?: string | null;
  title?: string | null;
  text?: string | null;
};

export async function createNote(
  db: D1Database,
  userId: string,
  input: NewNote
): Promise<Note> {
  const id = newId();
  const ts = nowIso();
  const title = input.title?.trim() || "Untitled note";
  const text = input.text ?? "";
  const json = toContentJson(text);

  await db.batch([
    db
      .prepare(
        `INSERT INTO notes
          (id, user_id, workspace_id, module_id, title, content_json, content_text,
           current_version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      )
      .bind(id, userId, input.workspaceId, input.moduleId ?? null, title, json, text, ts, ts),
    db
      .prepare(
        `INSERT INTO note_versions
          (id, note_id, user_id, version, title, content_json, content_text, created_at, source)
         VALUES (?, ?, ?, 1, ?, ?, ?, ?, 'create')`
      )
      .bind(newId(), id, userId, title, json, text, ts)
  ]);

  const created = await getNote(db, userId, id);
  if (!created) throw new Error("note insert did not persist");
  return created;
}

export type NotePatch = { title?: string; text?: string };

/**
 * Update the live note and, on the snapshot cadence, append a note_versions row.
 * No-op (returns the note unchanged) when nothing actually changed.
 */
export async function updateNote(
  db: D1Database,
  userId: string,
  id: string,
  patch: NotePatch,
  source: NoteSource = "autosave"
): Promise<Note | null> {
  const note = await getNote(db, userId, id);
  if (!note) return null;

  const nextTitle = patch.title !== undefined ? patch.title.trim() || "Untitled note" : note.title;
  const nextText = patch.text !== undefined ? patch.text : note.content_text;
  const changed = nextTitle !== note.title || nextText !== note.content_text;
  if (!changed && source !== "manual") return note;

  const ts = nowIso();
  const json = toContentJson(nextText);

  const last = await db
    .prepare(
      `SELECT version, created_at FROM note_versions
       WHERE note_id = ? AND user_id = ? ORDER BY version DESC LIMIT 1`
    )
    .bind(id, userId)
    .first<{ version: number; created_at: string }>();

  const lastAgeMs = last ? Date.now() - Date.parse(last.created_at) : Infinity;
  const snapshot = changed && (source === "manual" || !last || lastAgeMs > SNAPSHOT_INTERVAL_MS);
  const nextVersion = snapshot ? (last?.version ?? 0) + 1 : note.current_version;

  const statements = [
    db
      .prepare(
        `UPDATE notes SET title = ?, content_text = ?, content_json = ?, current_version = ?, updated_at = ?
         WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
      )
      .bind(nextTitle, nextText, json, nextVersion, ts, id, userId)
  ];
  if (snapshot) {
    statements.push(
      db
        .prepare(
          `INSERT INTO note_versions
            (id, note_id, user_id, version, title, content_json, content_text, created_at, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(newId(), id, userId, nextVersion, nextTitle, json, nextText, ts, source)
    );
  }
  await db.batch(statements);
  return getNote(db, userId, id);
}

export async function softDeleteNote(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const ts = nowIso();
  const { meta } = await db
    .prepare(
      `UPDATE notes SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(ts, ts, id, userId)
    .run();
  return meta.changes > 0;
}

export async function restoreNote(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE notes SET deleted_at = NULL, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`
    )
    .bind(nowIso(), id, userId)
    .run();
  return meta.changes > 0;
}

/** Permanent delete — separate from ordinary Delete (SECURITY.md). Cascades versions. */
export async function purgeNote(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const { meta } = await db
    .prepare(`DELETE FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`)
    .bind(id, userId)
    .run();
  return meta.changes > 0;
}

export async function listVersions(
  db: D1Database,
  userId: string,
  noteId: string
): Promise<NoteVersion[]> {
  const { results } = await db
    .prepare(
      `SELECT id, version, title, content_text, content_json, source, created_at
       FROM note_versions
       WHERE note_id = ? AND user_id = ?
       ORDER BY version DESC`
    )
    .bind(noteId, userId)
    .all<NoteVersion>();
  return results;
}

/**
 * Restore the content of an older version as the current note, appending a NEW
 * version (source "restore"). Later history is preserved (MASTER.md test 12).
 */
export async function restoreVersion(
  db: D1Database,
  userId: string,
  noteId: string,
  version: number
): Promise<Note | null> {
  const note = await getNote(db, userId, noteId);
  if (!note) return null;

  const target = await db
    .prepare(
      `SELECT title, content_json, content_text FROM note_versions
       WHERE note_id = ? AND user_id = ? AND version = ?`
    )
    .bind(noteId, userId, version)
    .first<{ title: string; content_json: string; content_text: string }>();
  if (!target) return null;

  const max = await db
    .prepare(
      `SELECT version FROM note_versions WHERE note_id = ? AND user_id = ? ORDER BY version DESC LIMIT 1`
    )
    .bind(noteId, userId)
    .first<{ version: number }>();
  const nextVersion = (max?.version ?? note.current_version) + 1;
  const ts = nowIso();

  await db.batch([
    db
      .prepare(
        `UPDATE notes SET title = ?, content_json = ?, content_text = ?, current_version = ?, updated_at = ?
         WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
      )
      .bind(target.title, target.content_json, target.content_text, nextVersion, ts, noteId, userId),
    db
      .prepare(
        `INSERT INTO note_versions
          (id, note_id, user_id, version, title, content_json, content_text, created_at, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'restore')`
      )
      .bind(newId(), noteId, userId, nextVersion, target.title, target.content_json, target.content_text, ts)
  ]);

  return getNote(db, userId, noteId);
}

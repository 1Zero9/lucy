import { newId, nowIso } from "./index";

export type Note = {
  id: string;
  workspace_id: string;
  module_id: string | null;
  folder_id: string | null;
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

export type NoteSource = "create" | "autosave" | "manual" | "restore" | "import";

const NOTE_COLUMNS =
  "id, workspace_id, module_id, folder_id, title, content_json, content_text, colour, is_pinned, current_version, created_at, updated_at, deleted_at";

/**
 * A fresh snapshot into note_versions is only taken when the previous one is
 * older than this, or when the caller asks for it (source "manual" / "restore").
 * Keeps autosave from producing a version per keystroke pause while still
 * protecting against overwrite mistakes (MASTER.md — version restore).
 */
const SNAPSHOT_INTERVAL_MS = 2 * 60 * 1000;

function toContentJson(text: string): string {
  return JSON.stringify({ type: "markdown", text });
}

export type NoteListOpts = {
  deleted?: boolean;
  /** null = notes with no folder; string = that folder; undefined = any. */
  folderId?: string | null;
  tagId?: string;
  moduleId?: string;
};

export async function listNotes(
  db: D1Database,
  userId: string,
  workspaceId: string,
  opts: NoteListOpts = {}
): Promise<Note[]> {
  const where: string[] = ["n.user_id = ?", "n.workspace_id = ?"];
  const values: unknown[] = [userId, workspaceId];

  where.push(opts.deleted ? "n.deleted_at IS NOT NULL" : "n.deleted_at IS NULL");

  if (opts.folderId === null) {
    where.push("n.folder_id IS NULL");
  } else if (typeof opts.folderId === "string") {
    where.push("n.folder_id = ?");
    values.push(opts.folderId);
  }

  if (opts.moduleId) {
    where.push("n.module_id = ?");
    values.push(opts.moduleId);
  }

  let join = "";
  if (opts.tagId) {
    join = "JOIN note_tags nt ON nt.note_id = n.id AND nt.user_id = n.user_id";
    where.push("nt.tag_id = ?");
    values.push(opts.tagId);
  }

  const order = opts.deleted ? "n.deleted_at DESC" : "n.is_pinned DESC, n.updated_at DESC";
  const cols = NOTE_COLUMNS.split(", ")
    .map((c) => `n.${c}`)
    .join(", ");

  const { results } = await db
    .prepare(
      `SELECT ${cols} FROM notes n ${join}
       WHERE ${where.join(" AND ")}
       ORDER BY ${order}`
    )
    .bind(...values)
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
  folderId?: string | null;
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
          (id, user_id, workspace_id, module_id, folder_id, title, content_json, content_text,
           current_version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      )
      .bind(
        id,
        userId,
        input.workspaceId,
        input.moduleId ?? null,
        input.folderId ?? null,
        title,
        json,
        text,
        ts,
        ts
      ),
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

export type NotePatch = {
  title?: string;
  text?: string;
  colour?: string | null;
  isPinned?: boolean;
  folderId?: string | null;
  moduleId?: string | null;
};

/**
 * Update the live note and, on the snapshot cadence, append a note_versions row.
 * Content changes (title/text) drive versioning; metadata changes (colour, pin,
 * folder) update the row only. No-op when nothing actually changed.
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
  const contentChanged = nextTitle !== note.title || nextText !== note.content_text;

  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.colour !== undefined) {
    sets.push("colour = ?");
    values.push(patch.colour);
  }
  if (patch.isPinned !== undefined) {
    sets.push("is_pinned = ?");
    values.push(patch.isPinned ? 1 : 0);
  }
  if (patch.folderId !== undefined) {
    sets.push("folder_id = ?");
    values.push(patch.folderId);
  }
  if (patch.moduleId !== undefined) {
    sets.push("module_id = ?");
    values.push(patch.moduleId);
  }
  const metaChanged = sets.length > 0;

  if (!contentChanged && !metaChanged && source !== "manual") return note;

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
  const snapshot =
    contentChanged && (source === "manual" || !last || lastAgeMs > SNAPSHOT_INTERVAL_MS);
  const nextVersion = snapshot ? (last?.version ?? 0) + 1 : note.current_version;

  const statements = [
    db
      .prepare(
        `UPDATE notes SET title = ?, content_text = ?, content_json = ?, current_version = ?, updated_at = ?${
          sets.length ? ", " + sets.join(", ") : ""
        }
         WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
      )
      .bind(nextTitle, nextText, json, nextVersion, ts, ...values, id, userId)
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
 * Append a version snapshot with the given content WITHOUT changing the live
 * note. Used by the offline sync layer to preserve a losing edit as history
 * when another device has already written to the note (MASTER.md — never lose
 * offline work).
 */
export async function snapshotVersion(
  db: D1Database,
  userId: string,
  noteId: string,
  content: { title: string; text: string },
  source: NoteSource = "import"
): Promise<NoteVersion | null> {
  const note = await getNote(db, userId, noteId, { includeDeleted: true });
  if (!note) return null;

  const max = await db
    .prepare(
      `SELECT version FROM note_versions WHERE note_id = ? AND user_id = ? ORDER BY version DESC LIMIT 1`
    )
    .bind(noteId, userId)
    .first<{ version: number }>();
  const version = (max?.version ?? note.current_version) + 1;
  const ts = nowIso();
  const title = content.title.trim() || "Untitled note";
  const id = newId();

  await db
    .prepare(
      `INSERT INTO note_versions
        (id, note_id, user_id, version, title, content_json, content_text, created_at, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, noteId, userId, version, title, toContentJson(content.text), content.text, ts, source)
    .run();

  return {
    id,
    version,
    title,
    content_text: content.text,
    content_json: toContentJson(content.text),
    source,
    created_at: ts
  };
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

import { newId, nowIso } from "./index";

export type Tag = {
  id: string;
  workspace_id: string;
  name: string;
  colour: string | null;
};

const COLUMNS = "id, workspace_id, name, colour";

export async function listTags(
  db: D1Database,
  userId: string,
  workspaceId: string
): Promise<Tag[]> {
  const { results } = await db
    .prepare(
      `SELECT ${COLUMNS} FROM tags
       WHERE user_id = ? AND workspace_id = ?
       ORDER BY name COLLATE NOCASE ASC`
    )
    .bind(userId, workspaceId)
    .all<Tag>();
  return results;
}

export async function deleteTag(db: D1Database, userId: string, id: string): Promise<boolean> {
  const { meta } = await db
    .prepare(`DELETE FROM tags WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .run();
  return meta.changes > 0;
}

/** Tags attached to a set of notes, keyed by note id. Owner-scoped. */
export async function tagsForNotes(
  db: D1Database,
  userId: string,
  noteIds: string[]
): Promise<Map<string, Tag[]>> {
  const map = new Map<string, Tag[]>();
  if (noteIds.length === 0) return map;
  const placeholders = noteIds.map(() => "?").join(", ");
  const { results } = await db
    .prepare(
      `SELECT nt.note_id AS note_id, t.id AS id, t.workspace_id AS workspace_id,
              t.name AS name, t.colour AS colour
       FROM note_tags nt
       JOIN tags t ON t.id = nt.tag_id
       WHERE nt.user_id = ? AND nt.note_id IN (${placeholders})
       ORDER BY t.name COLLATE NOCASE ASC`
    )
    .bind(userId, ...noteIds)
    .all<{ note_id: string } & Tag>();
  for (const row of results) {
    const { note_id, ...tag } = row;
    const list = map.get(note_id) ?? [];
    list.push(tag);
    map.set(note_id, list);
  }
  return map;
}

export async function tagsForNote(
  db: D1Database,
  userId: string,
  noteId: string
): Promise<Tag[]> {
  return (await tagsForNotes(db, userId, [noteId])).get(noteId) ?? [];
}

/**
 * Replace a note's tag set with the given names. Tags that don't exist in the
 * workspace yet are created. Returns the note's resulting tags.
 */
export async function setNoteTags(
  db: D1Database,
  userId: string,
  workspaceId: string,
  noteId: string,
  names: string[]
): Promise<Tag[]> {
  const cleaned = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 30);

  const existing = await listTags(db, userId, workspaceId);
  const byLower = new Map(existing.map((t) => [t.name.toLowerCase(), t]));
  const ts = nowIso();

  const tagIds: string[] = [];
  const inserts = [];
  for (const name of cleaned) {
    const found = byLower.get(name.toLowerCase());
    if (found) {
      tagIds.push(found.id);
      continue;
    }
    const id = newId();
    tagIds.push(id);
    inserts.push(
      db
        .prepare(
          `INSERT INTO tags (id, user_id, workspace_id, name, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(id, userId, workspaceId, name, ts, ts)
    );
  }

  const statements = [
    ...inserts,
    db.prepare(`DELETE FROM note_tags WHERE note_id = ? AND user_id = ?`).bind(noteId, userId),
    ...tagIds.map((tagId) =>
      db
        .prepare(
          `INSERT INTO note_tags (note_id, tag_id, user_id, created_at) VALUES (?, ?, ?, ?)`
        )
        .bind(noteId, tagId, userId, ts)
    )
  ];
  await db.batch(statements);
  return tagsForNote(db, userId, noteId);
}

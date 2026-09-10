import { newId, nowIso } from "./index";

export type Drawing = {
  id: string;
  workspace_id: string;
  note_id: string | null;
  title: string;
  r2_key: string;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, workspace_id, note_id, title, r2_key, width, height, created_at, updated_at";

export async function listDrawings(
  db: D1Database,
  userId: string,
  workspaceId: string,
  opts: { deleted?: boolean; noteId?: string } = {}
): Promise<Drawing[]> {
  const where = ["user_id = ?", "workspace_id = ?"];
  const values: unknown[] = [userId, workspaceId];
  where.push(opts.deleted ? "deleted_at IS NOT NULL" : "deleted_at IS NULL");
  if (opts.noteId) {
    where.push("note_id = ?");
    values.push(opts.noteId);
  }
  const { results } = await db
    .prepare(`SELECT ${COLUMNS} FROM drawings WHERE ${where.join(" AND ")} ORDER BY updated_at DESC`)
    .bind(...values)
    .all<Drawing>();
  return results;
}

export async function getDrawing(
  db: D1Database,
  userId: string,
  id: string,
  opts: { includeDeleted?: boolean } = {}
): Promise<Drawing | null> {
  const clause = opts.includeDeleted ? "" : "AND deleted_at IS NULL";
  return db
    .prepare(`SELECT ${COLUMNS} FROM drawings WHERE id = ? AND user_id = ? ${clause}`)
    .bind(id, userId)
    .first<Drawing>();
}

export async function createDrawing(
  db: D1Database,
  userId: string,
  input: {
    id: string;
    workspaceId: string;
    noteId?: string | null;
    title?: string;
    r2Key: string;
    width: number;
    height: number;
  }
): Promise<Drawing> {
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO drawings
        (id, user_id, workspace_id, note_id, title, r2_key, width, height, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      userId,
      input.workspaceId,
      input.noteId ?? null,
      input.title?.trim() || "Untitled drawing",
      input.r2Key,
      input.width,
      input.height,
      ts,
      ts
    )
    .run();
  const created = await getDrawing(db, userId, input.id);
  if (!created) throw new Error("drawing insert did not persist");
  return created;
}

export async function touchDrawing(
  db: D1Database,
  userId: string,
  id: string,
  patch: { title?: string; width?: number; height?: number }
): Promise<Drawing | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.title !== undefined) {
    sets.push("title = ?");
    values.push(patch.title.trim() || "Untitled drawing");
  }
  if (patch.width !== undefined) {
    sets.push("width = ?");
    values.push(patch.width);
  }
  if (patch.height !== undefined) {
    sets.push("height = ?");
    values.push(patch.height);
  }
  sets.push("updated_at = ?");
  values.push(nowIso());
  const { meta } = await db
    .prepare(
      `UPDATE drawings SET ${sets.join(", ")} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(...values, id, userId)
    .run();
  if (meta.changes === 0) return null;
  return getDrawing(db, userId, id);
}

export async function softDeleteDrawing(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const ts = nowIso();
  const { meta } = await db
    .prepare(
      `UPDATE drawings SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(ts, ts, id, userId)
    .run();
  return meta.changes > 0;
}

export async function restoreDrawing(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE drawings SET deleted_at = NULL, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`
    )
    .bind(nowIso(), id, userId)
    .run();
  return meta.changes > 0;
}

import { newId, nowIso } from "./index";

export type Sticky = {
  id: string;
  workspace_id: string;
  body: string;
  colour: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id, workspace_id, body, colour, sort_order, created_at, updated_at";

export async function listStickies(
  db: D1Database,
  userId: string,
  workspaceId: string,
  opts: { deleted?: boolean } = {}
): Promise<Sticky[]> {
  const clause = opts.deleted ? "deleted_at IS NOT NULL" : "deleted_at IS NULL";
  const { results } = await db
    .prepare(
      `SELECT ${COLUMNS} FROM stickies
       WHERE user_id = ? AND workspace_id = ? AND ${clause}
       ORDER BY sort_order ASC, updated_at DESC`
    )
    .bind(userId, workspaceId)
    .all<Sticky>();
  return results;
}

export async function getSticky(
  db: D1Database,
  userId: string,
  id: string
): Promise<Sticky | null> {
  return db
    .prepare(`SELECT ${COLUMNS} FROM stickies WHERE id = ? AND user_id = ? AND deleted_at IS NULL`)
    .bind(id, userId)
    .first<Sticky>();
}

export async function createSticky(
  db: D1Database,
  userId: string,
  workspaceId: string,
  input: { body: string; colour?: string | null }
): Promise<Sticky> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO stickies (id, user_id, workspace_id, body, colour, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, userId, workspaceId, input.body, input.colour ?? null, ts, ts)
    .run();
  const created = await getSticky(db, userId, id);
  if (!created) throw new Error("sticky insert did not persist");
  return created;
}

export async function updateSticky(
  db: D1Database,
  userId: string,
  id: string,
  patch: { body?: string; colour?: string | null }
): Promise<Sticky | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.body !== undefined) {
    sets.push("body = ?");
    values.push(patch.body);
  }
  if (patch.colour !== undefined) {
    sets.push("colour = ?");
    values.push(patch.colour);
  }
  if (sets.length === 0) return getSticky(db, userId, id);
  sets.push("updated_at = ?");
  values.push(nowIso());
  const { meta } = await db
    .prepare(
      `UPDATE stickies SET ${sets.join(", ")}
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(...values, id, userId)
    .run();
  if (meta.changes === 0) return null;
  return getSticky(db, userId, id);
}

export async function softDeleteSticky(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const ts = nowIso();
  const { meta } = await db
    .prepare(
      `UPDATE stickies SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(ts, ts, id, userId)
    .run();
  return meta.changes > 0;
}

export async function restoreSticky(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE stickies SET deleted_at = NULL, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`
    )
    .bind(nowIso(), id, userId)
    .run();
  return meta.changes > 0;
}

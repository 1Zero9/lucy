import { newId, nowIso } from "./index";

export type Workspace = {
  id: string;
  name: string;
  purpose: string | null;
  description: string | null;
  colour: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id, name, purpose, description, colour, created_at, updated_at";

/** All of a user's live workspaces, newest activity first. */
export async function listWorkspaces(db: D1Database, userId: string): Promise<Workspace[]> {
  const { results } = await db
    .prepare(
      `SELECT ${COLUMNS} FROM workspaces
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY updated_at DESC`
    )
    .bind(userId)
    .all<Workspace>();
  return results;
}

export async function getWorkspace(
  db: D1Database,
  userId: string,
  id: string
): Promise<Workspace | null> {
  return db
    .prepare(
      `SELECT ${COLUMNS} FROM workspaces
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(id, userId)
    .first<Workspace>();
}

export async function countWorkspaces(db: D1Database, userId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM workspaces WHERE user_id = ? AND deleted_at IS NULL`
    )
    .bind(userId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export type NewWorkspace = {
  name: string;
  purpose?: string | null;
  description?: string | null;
  colour?: string | null;
};

export async function createWorkspace(
  db: D1Database,
  userId: string,
  input: NewWorkspace
): Promise<Workspace> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO workspaces
        (id, user_id, name, purpose, description, colour, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      userId,
      input.name,
      input.purpose ?? null,
      input.description ?? null,
      input.colour ?? null,
      ts,
      ts
    )
    .run();
  const created = await getWorkspace(db, userId, id);
  if (!created) throw new Error("workspace insert did not persist");
  return created;
}

export type WorkspacePatch = Partial<NewWorkspace>;

export async function updateWorkspace(
  db: D1Database,
  userId: string,
  id: string,
  patch: WorkspacePatch
): Promise<Workspace | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.name !== undefined) {
    sets.push("name = ?");
    values.push(patch.name);
  }
  if (patch.purpose !== undefined) {
    sets.push("purpose = ?");
    values.push(patch.purpose);
  }
  if (patch.description !== undefined) {
    sets.push("description = ?");
    values.push(patch.description);
  }
  if (patch.colour !== undefined) {
    sets.push("colour = ?");
    values.push(patch.colour);
  }
  if (sets.length === 0) return getWorkspace(db, userId, id);

  sets.push("updated_at = ?");
  values.push(nowIso());

  const { meta } = await db
    .prepare(
      `UPDATE workspaces SET ${sets.join(", ")}
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(...values, id, userId)
    .run();
  if (meta.changes === 0) return null;
  return getWorkspace(db, userId, id);
}

/** Soft delete. Returns false when the workspace isn't the caller's / already gone. */
export async function softDeleteWorkspace(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const ts = nowIso();
  const { meta } = await db
    .prepare(
      `UPDATE workspaces SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(ts, ts, id, userId)
    .run();
  return meta.changes > 0;
}

export async function restoreWorkspace(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE workspaces SET deleted_at = NULL, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`
    )
    .bind(nowIso(), id, userId)
    .run();
  return meta.changes > 0;
}

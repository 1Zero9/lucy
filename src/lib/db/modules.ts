import { newId, nowIso } from "./index";

export type Module = {
  id: string;
  workspace_id: string;
  period_id: string | null;
  name: string;
  code: string | null;
  description: string | null;
  colour: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, workspace_id, period_id, name, code, description, colour, icon, sort_order, created_at, updated_at";

export const DEFAULT_MODULE_COLOUR = "#A78BFA";

/** Live modules in a workspace the user owns. */
export async function listModules(
  db: D1Database,
  userId: string,
  workspaceId: string
): Promise<Module[]> {
  const { results } = await db
    .prepare(
      `SELECT ${COLUMNS} FROM modules
       WHERE user_id = ? AND workspace_id = ? AND deleted_at IS NULL
       ORDER BY sort_order ASC, updated_at DESC`
    )
    .bind(userId, workspaceId)
    .all<Module>();
  return results;
}

export async function getModule(
  db: D1Database,
  userId: string,
  id: string
): Promise<Module | null> {
  return db
    .prepare(
      `SELECT ${COLUMNS} FROM modules
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(id, userId)
    .first<Module>();
}

export type NewModule = {
  workspaceId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  colour?: string | null;
  periodId?: string | null;
};

export async function createModule(
  db: D1Database,
  userId: string,
  input: NewModule
): Promise<Module> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO modules
        (id, user_id, workspace_id, period_id, name, code, description, colour, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      userId,
      input.workspaceId,
      input.periodId ?? null,
      input.name,
      input.code ?? null,
      input.description ?? null,
      input.colour ?? DEFAULT_MODULE_COLOUR,
      ts,
      ts
    )
    .run();
  const created = await getModule(db, userId, id);
  if (!created) throw new Error("module insert did not persist");
  return created;
}

export type ModulePatch = {
  name?: string;
  code?: string | null;
  description?: string | null;
  colour?: string;
  periodId?: string | null;
};

export async function updateModule(
  db: D1Database,
  userId: string,
  id: string,
  patch: ModulePatch
): Promise<Module | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.name !== undefined) {
    sets.push("name = ?");
    values.push(patch.name);
  }
  if (patch.code !== undefined) {
    sets.push("code = ?");
    values.push(patch.code);
  }
  if (patch.description !== undefined) {
    sets.push("description = ?");
    values.push(patch.description);
  }
  if (patch.colour !== undefined) {
    sets.push("colour = ?");
    values.push(patch.colour);
  }
  if (patch.periodId !== undefined) {
    sets.push("period_id = ?");
    values.push(patch.periodId);
  }
  if (sets.length === 0) return getModule(db, userId, id);

  sets.push("updated_at = ?");
  values.push(nowIso());

  const { meta } = await db
    .prepare(
      `UPDATE modules SET ${sets.join(", ")}
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(...values, id, userId)
    .run();
  if (meta.changes === 0) return null;
  return getModule(db, userId, id);
}

export async function softDeleteModule(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const ts = nowIso();
  const { meta } = await db
    .prepare(
      `UPDATE modules SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(ts, ts, id, userId)
    .run();
  return meta.changes > 0;
}

export async function restoreModule(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE modules SET deleted_at = NULL, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`
    )
    .bind(nowIso(), id, userId)
    .run();
  return meta.changes > 0;
}

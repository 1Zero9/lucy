import { newId, nowIso } from "./index";

/**
 * Periods are the optional "Year 1 / Semester 2 / Sprint / Course Week" grouping
 * inside a workspace (PRODUCT_SPEC.md). Phase 1B ships list + create + soft
 * delete; richer editing comes with the responsive workspace views.
 */
export type Period = {
  id: string;
  workspace_id: string;
  name: string;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, workspace_id, name, sort_order, starts_at, ends_at, created_at, updated_at";

export async function listPeriods(
  db: D1Database,
  userId: string,
  workspaceId: string
): Promise<Period[]> {
  const { results } = await db
    .prepare(
      `SELECT ${COLUMNS} FROM periods
       WHERE user_id = ? AND workspace_id = ? AND deleted_at IS NULL
       ORDER BY sort_order ASC, created_at ASC`
    )
    .bind(userId, workspaceId)
    .all<Period>();
  return results;
}

export type NewPeriod = {
  workspaceId: string;
  name: string;
  startsAt?: string | null;
  endsAt?: string | null;
};

export async function createPeriod(
  db: D1Database,
  userId: string,
  input: NewPeriod
): Promise<Period> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO periods
        (id, user_id, workspace_id, name, starts_at, ends_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      userId,
      input.workspaceId,
      input.name,
      input.startsAt ?? null,
      input.endsAt ?? null,
      ts,
      ts
    )
    .run();
  const created = await db
    .prepare(`SELECT ${COLUMNS} FROM periods WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .first<Period>();
  if (!created) throw new Error("period insert did not persist");
  return created;
}

export async function softDeletePeriod(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const ts = nowIso();
  const { meta } = await db
    .prepare(
      `UPDATE periods SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(ts, ts, id, userId)
    .run();
  return meta.changes > 0;
}

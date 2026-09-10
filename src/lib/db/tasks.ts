import { newId, nowIso } from "./index";

export type TaskStatus = "open" | "done";

export type Task = {
  id: string;
  workspace_id: string;
  module_id: string | null;
  note_id: string | null;
  title: string;
  detail: string | null;
  status: TaskStatus;
  due_at: string | null;
  remind_at: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, workspace_id, module_id, note_id, title, detail, status, due_at, remind_at, completed_at, sort_order, created_at, updated_at";

export type TaskListOpts = {
  status?: TaskStatus;
  noteId?: string;
  deleted?: boolean;
};

export async function listTasks(
  db: D1Database,
  userId: string,
  workspaceId: string,
  opts: TaskListOpts = {}
): Promise<Task[]> {
  const where = ["user_id = ?", "workspace_id = ?"];
  const values: unknown[] = [userId, workspaceId];
  where.push(opts.deleted ? "deleted_at IS NOT NULL" : "deleted_at IS NULL");
  if (opts.status) {
    where.push("status = ?");
    values.push(opts.status);
  }
  if (opts.noteId) {
    where.push("note_id = ?");
    values.push(opts.noteId);
  }
  const { results } = await db
    .prepare(
      `SELECT ${COLUMNS} FROM tasks
       WHERE ${where.join(" AND ")}
       ORDER BY (due_at IS NULL) ASC, due_at ASC, sort_order ASC, created_at ASC`
    )
    .bind(...values)
    .all<Task>();
  return results;
}

export async function getTask(db: D1Database, userId: string, id: string): Promise<Task | null> {
  return db
    .prepare(`SELECT ${COLUMNS} FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL`)
    .bind(id, userId)
    .first<Task>();
}

export type NewTask = {
  workspaceId: string;
  title: string;
  detail?: string | null;
  dueAt?: string | null;
  remindAt?: string | null;
  moduleId?: string | null;
  noteId?: string | null;
};

export async function createTask(
  db: D1Database,
  userId: string,
  input: NewTask
): Promise<Task> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO tasks
        (id, user_id, workspace_id, module_id, note_id, title, detail, due_at, remind_at,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      userId,
      input.workspaceId,
      input.moduleId ?? null,
      input.noteId ?? null,
      input.title,
      input.detail ?? null,
      input.dueAt ?? null,
      input.remindAt ?? null,
      ts,
      ts
    )
    .run();
  const created = await getTask(db, userId, id);
  if (!created) throw new Error("task insert did not persist");
  return created;
}

export type TaskPatch = {
  title?: string;
  detail?: string | null;
  status?: TaskStatus;
  dueAt?: string | null;
  remindAt?: string | null;
  moduleId?: string | null;
  noteId?: string | null;
};

export async function updateTask(
  db: D1Database,
  userId: string,
  id: string,
  patch: TaskPatch
): Promise<Task | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  const col = (name: string, value: unknown) => {
    sets.push(`${name} = ?`);
    values.push(value);
  };

  if (patch.title !== undefined) col("title", patch.title);
  if (patch.detail !== undefined) col("detail", patch.detail);
  if (patch.dueAt !== undefined) col("due_at", patch.dueAt);
  if (patch.remindAt !== undefined) col("remind_at", patch.remindAt);
  if (patch.moduleId !== undefined) col("module_id", patch.moduleId);
  if (patch.noteId !== undefined) col("note_id", patch.noteId);
  if (patch.status !== undefined) {
    col("status", patch.status);
    col("completed_at", patch.status === "done" ? nowIso() : null);
  }
  if (sets.length === 0) return getTask(db, userId, id);

  col("updated_at", nowIso());
  const { meta } = await db
    .prepare(
      `UPDATE tasks SET ${sets.join(", ")}
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(...values, id, userId)
    .run();
  if (meta.changes === 0) return null;
  return getTask(db, userId, id);
}

export async function softDeleteTask(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const ts = nowIso();
  const { meta } = await db
    .prepare(
      `UPDATE tasks SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(ts, ts, id, userId)
    .run();
  return meta.changes > 0;
}

export async function restoreTask(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE tasks SET deleted_at = NULL, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`
    )
    .bind(nowIso(), id, userId)
    .run();
  return meta.changes > 0;
}

import { newId, nowIso } from "./index";
import { schedule, type Grade } from "@/lib/srs";

export type Flashcard = {
  id: string;
  workspace_id: string;
  module_id: string | null;
  note_id: string | null;
  front: string;
  back: string;
  ease: number;
  interval_days: number;
  reps: number;
  lapses: number;
  due_at: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, workspace_id, module_id, note_id, front, back, ease, interval_days, reps, lapses, due_at, last_reviewed_at, created_at, updated_at";

export async function listFlashcards(
  db: D1Database,
  userId: string,
  workspaceId: string,
  opts: { deleted?: boolean; moduleId?: string; noteId?: string } = {}
): Promise<Flashcard[]> {
  const where = ["user_id = ?", "workspace_id = ?"];
  const values: unknown[] = [userId, workspaceId];
  where.push(opts.deleted ? "deleted_at IS NOT NULL" : "deleted_at IS NULL");
  if (opts.moduleId) {
    where.push("module_id = ?");
    values.push(opts.moduleId);
  }
  if (opts.noteId) {
    where.push("note_id = ?");
    values.push(opts.noteId);
  }
  const { results } = await db
    .prepare(
      `SELECT ${COLUMNS} FROM flashcards WHERE ${where.join(" AND ")} ORDER BY created_at ASC`
    )
    .bind(...values)
    .all<Flashcard>();
  return results;
}

/** Cards that are new (due_at IS NULL) or due now, oldest-due first. */
export async function listDueFlashcards(
  db: D1Database,
  userId: string,
  workspaceId: string,
  limit = 40
): Promise<Flashcard[]> {
  const { results } = await db
    .prepare(
      `SELECT ${COLUMNS} FROM flashcards
       WHERE user_id = ? AND workspace_id = ? AND deleted_at IS NULL
         AND (due_at IS NULL OR due_at <= ?)
       ORDER BY (due_at IS NULL) DESC, due_at ASC
       LIMIT ?`
    )
    .bind(userId, workspaceId, nowIso(), limit)
    .all<Flashcard>();
  return results;
}

export async function getFlashcard(
  db: D1Database,
  userId: string,
  id: string
): Promise<Flashcard | null> {
  return db
    .prepare(`SELECT ${COLUMNS} FROM flashcards WHERE id = ? AND user_id = ? AND deleted_at IS NULL`)
    .bind(id, userId)
    .first<Flashcard>();
}

export type NewFlashcard = {
  workspaceId: string;
  front: string;
  back: string;
  moduleId?: string | null;
  noteId?: string | null;
};

export async function createFlashcard(
  db: D1Database,
  userId: string,
  input: NewFlashcard
): Promise<Flashcard> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO flashcards
        (id, user_id, workspace_id, module_id, note_id, front, back, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      userId,
      input.workspaceId,
      input.moduleId ?? null,
      input.noteId ?? null,
      input.front,
      input.back,
      ts,
      ts
    )
    .run();
  const created = await getFlashcard(db, userId, id);
  if (!created) throw new Error("flashcard insert did not persist");
  return created;
}

export async function updateFlashcard(
  db: D1Database,
  userId: string,
  id: string,
  patch: { front?: string; back?: string; moduleId?: string | null }
): Promise<Flashcard | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.front !== undefined) {
    sets.push("front = ?");
    values.push(patch.front);
  }
  if (patch.back !== undefined) {
    sets.push("back = ?");
    values.push(patch.back);
  }
  if (patch.moduleId !== undefined) {
    sets.push("module_id = ?");
    values.push(patch.moduleId);
  }
  if (sets.length === 0) return getFlashcard(db, userId, id);
  sets.push("updated_at = ?");
  values.push(nowIso());
  const { meta } = await db
    .prepare(
      `UPDATE flashcards SET ${sets.join(", ")} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(...values, id, userId)
    .run();
  if (meta.changes === 0) return null;
  return getFlashcard(db, userId, id);
}

/** Apply a review grade: recompute SRS state and the next due date. */
export async function reviewFlashcard(
  db: D1Database,
  userId: string,
  id: string,
  grade: Grade
): Promise<Flashcard | null> {
  const card = await getFlashcard(db, userId, id);
  if (!card) return null;

  const next = schedule(
    { ease: card.ease, intervalDays: card.interval_days, reps: card.reps, lapses: card.lapses },
    grade
  );
  const ts = nowIso();
  const { meta } = await db
    .prepare(
      `UPDATE flashcards
       SET ease = ?, interval_days = ?, reps = ?, lapses = ?, due_at = ?, last_reviewed_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(next.ease, next.intervalDays, next.reps, next.lapses, next.dueAt, ts, ts, id, userId)
    .run();
  if (meta.changes === 0) return null;
  return getFlashcard(db, userId, id);
}

export async function softDeleteFlashcard(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const ts = nowIso();
  const { meta } = await db
    .prepare(
      `UPDATE flashcards SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(ts, ts, id, userId)
    .run();
  return meta.changes > 0;
}

export async function restoreFlashcard(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE flashcards SET deleted_at = NULL, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`
    )
    .bind(nowIso(), id, userId)
    .run();
  return meta.changes > 0;
}

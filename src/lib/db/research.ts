import { newId, nowIso } from "./index";

export type ResearchKind = "link" | "book" | "paper" | "video" | "other";

export type ResearchItem = {
  id: string;
  workspace_id: string;
  module_id: string | null;
  note_id: string | null;
  title: string;
  url: string | null;
  kind: ResearchKind;
  annotation: string;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, workspace_id, module_id, note_id, title, url, kind, annotation, created_at, updated_at";

export async function listResearch(
  db: D1Database,
  userId: string,
  workspaceId: string,
  opts: { deleted?: boolean; noteId?: string } = {}
): Promise<ResearchItem[]> {
  const where = ["user_id = ?", "workspace_id = ?"];
  const values: unknown[] = [userId, workspaceId];
  where.push(opts.deleted ? "deleted_at IS NOT NULL" : "deleted_at IS NULL");
  if (opts.noteId) {
    where.push("note_id = ?");
    values.push(opts.noteId);
  }
  const { results } = await db
    .prepare(
      `SELECT ${COLUMNS} FROM research_items WHERE ${where.join(" AND ")} ORDER BY updated_at DESC`
    )
    .bind(...values)
    .all<ResearchItem>();
  return results;
}

export async function getResearch(
  db: D1Database,
  userId: string,
  id: string
): Promise<ResearchItem | null> {
  return db
    .prepare(
      `SELECT ${COLUMNS} FROM research_items WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(id, userId)
    .first<ResearchItem>();
}

export type NewResearch = {
  workspaceId: string;
  title: string;
  url?: string | null;
  kind?: ResearchKind;
  annotation?: string;
  moduleId?: string | null;
  noteId?: string | null;
};

export async function createResearch(
  db: D1Database,
  userId: string,
  input: NewResearch
): Promise<ResearchItem> {
  const id = newId();
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO research_items
        (id, user_id, workspace_id, module_id, note_id, title, url, kind, annotation, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      userId,
      input.workspaceId,
      input.moduleId ?? null,
      input.noteId ?? null,
      input.title,
      input.url ?? null,
      input.kind ?? "link",
      input.annotation ?? "",
      ts,
      ts
    )
    .run();
  const created = await getResearch(db, userId, id);
  if (!created) throw new Error("research insert did not persist");
  return created;
}

export type ResearchPatch = {
  title?: string;
  url?: string | null;
  kind?: ResearchKind;
  annotation?: string;
};

export async function updateResearch(
  db: D1Database,
  userId: string,
  id: string,
  patch: ResearchPatch
): Promise<ResearchItem | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, col] of [
    ["title", "title"],
    ["url", "url"],
    ["kind", "kind"],
    ["annotation", "annotation"]
  ] as const) {
    if (patch[key] !== undefined) {
      sets.push(`${col} = ?`);
      values.push(patch[key]);
    }
  }
  if (sets.length === 0) return getResearch(db, userId, id);
  sets.push("updated_at = ?");
  values.push(nowIso());
  const { meta } = await db
    .prepare(
      `UPDATE research_items SET ${sets.join(", ")}
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(...values, id, userId)
    .run();
  if (meta.changes === 0) return null;
  return getResearch(db, userId, id);
}

export async function softDeleteResearch(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const ts = nowIso();
  const { meta } = await db
    .prepare(
      `UPDATE research_items SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(ts, ts, id, userId)
    .run();
  return meta.changes > 0;
}

export async function restoreResearch(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE research_items SET deleted_at = NULL, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`
    )
    .bind(nowIso(), id, userId)
    .run();
  return meta.changes > 0;
}

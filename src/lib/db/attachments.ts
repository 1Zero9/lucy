import { newId, nowIso } from "./index";

export type Attachment = {
  id: string;
  workspace_id: string;
  note_id: string | null;
  r2_key: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const COLUMNS =
  "id, workspace_id, note_id, r2_key, filename, content_type, size_bytes, created_at, updated_at, deleted_at";

export async function listAttachments(
  db: D1Database,
  userId: string,
  workspaceId: string,
  opts: { noteId?: string; deleted?: boolean } = {}
): Promise<Attachment[]> {
  const where = ["user_id = ?", "workspace_id = ?"];
  const values: unknown[] = [userId, workspaceId];
  where.push(opts.deleted ? "deleted_at IS NOT NULL" : "deleted_at IS NULL");
  if (opts.noteId) {
    where.push("note_id = ?");
    values.push(opts.noteId);
  }
  const { results } = await db
    .prepare(
      `SELECT ${COLUMNS} FROM attachments WHERE ${where.join(" AND ")} ORDER BY created_at DESC`
    )
    .bind(...values)
    .all<Attachment>();
  return results;
}

export async function getAttachment(
  db: D1Database,
  userId: string,
  id: string,
  opts: { includeDeleted?: boolean } = {}
): Promise<Attachment | null> {
  const clause = opts.includeDeleted ? "" : "AND deleted_at IS NULL";
  return db
    .prepare(`SELECT ${COLUMNS} FROM attachments WHERE id = ? AND user_id = ? ${clause}`)
    .bind(id, userId)
    .first<Attachment>();
}

export type NewAttachment = {
  id: string;
  workspaceId: string;
  noteId?: string | null;
  r2Key: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
};

export async function createAttachment(
  db: D1Database,
  userId: string,
  input: NewAttachment
): Promise<Attachment> {
  const ts = nowIso();
  await db
    .prepare(
      `INSERT INTO attachments
        (id, user_id, workspace_id, note_id, r2_key, filename, content_type, size_bytes,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      userId,
      input.workspaceId,
      input.noteId ?? null,
      input.r2Key,
      input.filename,
      input.contentType,
      input.sizeBytes,
      ts,
      ts
    )
    .run();
  const created = await getAttachment(db, userId, input.id);
  if (!created) throw new Error("attachment insert did not persist");
  return created;
}

export async function softDeleteAttachment(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const ts = nowIso();
  const { meta } = await db
    .prepare(
      `UPDATE attachments SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(ts, ts, id, userId)
    .run();
  return meta.changes > 0;
}

export async function restoreAttachment(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE attachments SET deleted_at = NULL, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`
    )
    .bind(nowIso(), id, userId)
    .run();
  return meta.changes > 0;
}

/** Removes the metadata row. Caller deletes the R2 object. */
export async function purgeAttachmentRow(
  db: D1Database,
  userId: string,
  id: string
): Promise<boolean> {
  const { meta } = await db
    .prepare(`DELETE FROM attachments WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`)
    .bind(id, userId)
    .run();
  return meta.changes > 0;
}

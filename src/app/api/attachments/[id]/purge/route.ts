import { withUser, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getAttachment, purgeAttachmentRow } from "@/lib/db/attachments";
import { deleteObject } from "@/lib/storage/attachments";

/** Permanent delete of an already soft-deleted file: removes the R2 object too. */
export const POST = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const db = getDb();

  const attachment = await getAttachment(db, user.id, id, { includeDeleted: true });
  if (!attachment || !attachment.deleted_at) {
    return jsonError(404, "Nothing to delete permanently.");
  }

  await deleteObject(attachment.r2_key).catch(() => {});
  const ok = await purgeAttachmentRow(db, user.id, id);
  if (!ok) return jsonError(404, "Nothing to delete permanently.");
  return Response.json({ ok: true });
});

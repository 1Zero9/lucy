import { withUser, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getAttachment, softDeleteAttachment } from "@/lib/db/attachments";

export const GET = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const attachment = await getAttachment(getDb(), user.id, id);
  if (!attachment) return jsonError(404, "File not found.");
  return Response.json({ attachment });
});

export const DELETE = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await softDeleteAttachment(getDb(), user.id, id);
  if (!ok) return jsonError(404, "File not found.");
  return Response.json({ ok: true });
});

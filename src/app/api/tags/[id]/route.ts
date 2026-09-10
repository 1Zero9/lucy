import { withUser, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { deleteTag } from "@/lib/db/tags";

/** Removes the tag everywhere (note_tags rows cascade). */
export const DELETE = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await deleteTag(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Tag not found.");
  return Response.json({ ok: true });
});

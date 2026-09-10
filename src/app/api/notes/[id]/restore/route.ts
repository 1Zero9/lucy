import { withUser, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { restoreNote } from "@/lib/db/notes";

export const POST = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await restoreNote(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Nothing to restore.");
  return Response.json({ ok: true });
});

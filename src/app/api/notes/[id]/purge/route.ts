import { withUser, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { purgeNote } from "@/lib/db/notes";

/** Permanent delete. Only works on an already soft-deleted note (SECURITY.md). */
export const POST = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await purgeNote(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Nothing to delete permanently.");
  return Response.json({ ok: true });
});

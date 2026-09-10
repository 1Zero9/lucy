import { withUser, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getNote, listVersions } from "@/lib/db/notes";

export const GET = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const db = getDb();
  const note = await getNote(db, user.id, id, { includeDeleted: true });
  if (!note) return jsonError(404, "Note not found.");
  const versions = await listVersions(db, user.id, id);
  return Response.json({ versions });
});

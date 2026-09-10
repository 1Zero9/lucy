import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getNote } from "@/lib/db/notes";
import { tagsForNote, setNoteTags } from "@/lib/db/tags";
import { asObject, ValidationError } from "@/lib/validation";

export const GET = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const db = getDb();
  const note = await getNote(db, user.id, id);
  if (!note) return jsonError(404, "Note not found.");
  return Response.json({ tags: await tagsForNote(db, user.id, id) });
});

export const PUT = withUser(async (user, request, { params }) => {
  const { id } = await params;
  const db = getDb();
  const note = await getNote(db, user.id, id);
  if (!note) return jsonError(404, "Note not found.");

  const body = asObject(await readJsonBody(request));
  if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string")) {
    throw new ValidationError("tags must be an array of strings.");
  }
  const tags = await setNoteTags(db, user.id, note.workspace_id, id, body.tags as string[]);
  return Response.json({ tags });
});

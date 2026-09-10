import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getNote, listVersions, snapshotVersion } from "@/lib/db/notes";
import { asObject, optionalString, noteText } from "@/lib/validation";

export const GET = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const db = getDb();
  const note = await getNote(db, user.id, id, { includeDeleted: true });
  if (!note) return jsonError(404, "Note not found.");
  const versions = await listVersions(db, user.id, id);
  return Response.json({ versions });
});

/**
 * Append a version snapshot with arbitrary content, without changing the live
 * note. Used by the offline sync layer to keep a losing edit as history.
 */
export const POST = withUser(async (user, request, { params }) => {
  const { id } = await params;
  const db = getDb();
  const note = await getNote(db, user.id, id, { includeDeleted: true });
  if (!note) return jsonError(404, "Note not found.");

  const body = asObject(await readJsonBody(request));
  const version = await snapshotVersion(
    db,
    user.id,
    id,
    {
      title: optionalString(body.title, { field: "Title", max: 200 }) ?? note.title,
      text: noteText(body.text)
    },
    body.source === "manual" ? "manual" : "import"
  );
  if (!version) return jsonError(404, "Note not found.");
  return Response.json({ version }, { status: 201 });
});

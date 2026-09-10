import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getNote, updateNote, softDeleteNote } from "@/lib/db/notes";
import { asObject, optionalString, noteText, ValidationError } from "@/lib/validation";

export const GET = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const note = await getNote(getDb(), user.id, id);
  if (!note) return jsonError(404, "Note not found.");
  return Response.json({ note });
});

export const PATCH = withUser(async (user, request, { params }) => {
  const { id } = await params;
  const body = asObject(await readJsonBody(request));

  const patch: { title?: string; text?: string } = {};
  if ("title" in body) {
    patch.title = optionalString(body.title, { field: "Title", max: 200 }) ?? "";
  }
  if ("text" in body) patch.text = noteText(body.text);
  if (patch.title === undefined && patch.text === undefined) {
    throw new ValidationError("Nothing to update.");
  }

  const source = body.source === "manual" ? "manual" : "autosave";
  const note = await updateNote(getDb(), user.id, id, patch, source);
  if (!note) return jsonError(404, "Note not found.");
  return Response.json({ note });
});

export const DELETE = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await softDeleteNote(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Note not found.");
  return Response.json({ ok: true });
});

import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getNote, updateNote, softDeleteNote } from "@/lib/db/notes";
import { getFolder } from "@/lib/db/folders";
import {
  asObject,
  optionalString,
  optionalColour,
  noteText,
  ValidationError
} from "@/lib/validation";

export const GET = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const note = await getNote(getDb(), user.id, id);
  if (!note) return jsonError(404, "Note not found.");
  return Response.json({ note });
});

export const PATCH = withUser(async (user, request, { params }) => {
  const { id } = await params;
  const db = getDb();
  const body = asObject(await readJsonBody(request));

  const note = await getNote(db, user.id, id);
  if (!note) return jsonError(404, "Note not found.");

  const patch: {
    title?: string;
    text?: string;
    colour?: string | null;
    isPinned?: boolean;
    folderId?: string | null;
  } = {};

  if ("title" in body) patch.title = optionalString(body.title, { field: "Title", max: 200 }) ?? "";
  if ("text" in body) patch.text = noteText(body.text);
  if ("colour" in body) patch.colour = optionalColour(body.colour);
  if ("isPinned" in body) {
    if (typeof body.isPinned !== "boolean") throw new ValidationError("isPinned must be a boolean.");
    patch.isPinned = body.isPinned;
  }
  if ("folderId" in body) {
    const folderId = optionalString(body.folderId, { field: "folderId", max: 64 });
    if (folderId) {
      const folder = await getFolder(db, user.id, folderId);
      if (!folder || folder.workspace_id !== note.workspace_id) {
        return jsonError(400, "That folder is not in this workspace.");
      }
    }
    patch.folderId = folderId;
  }

  if (Object.keys(patch).length === 0) throw new ValidationError("Nothing to update.");

  const source = body.source === "manual" ? "manual" : "autosave";
  const updated = await updateNote(db, user.id, id, patch, source);
  if (!updated) return jsonError(404, "Note not found.");
  return Response.json({ note: updated });
});

export const DELETE = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await softDeleteNote(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Note not found.");
  return Response.json({ ok: true });
});

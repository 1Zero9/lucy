import { withUser, jsonError } from "@/lib/api";
import { getDb, newId } from "@/lib/db";
import { getWorkspace } from "@/lib/db/workspaces";
import { getNote } from "@/lib/db/notes";
import { listDrawings, createDrawing } from "@/lib/db/drawings";
import { drawingKey, putObject, deleteObject } from "@/lib/storage/attachments";
import { MAX_ATTACHMENT_BYTES } from "@/lib/storage/limits";

export const GET = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");
  const q = new URL(request.url).searchParams;
  return Response.json({
    drawings: await listDrawings(db, user.id, workspaceId, {
      deleted: q.get("deleted") === "1",
      noteId: q.get("noteId") ?? undefined
    })
  });
});

export const POST = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "Expected a multipart form upload.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.type !== "image/png") {
    return jsonError(415, "A PNG image is required.");
  }
  if (file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES) {
    return jsonError(413, "That drawing is too large.");
  }

  const noteId = (form.get("noteId") as string | null)?.trim() || null;
  if (noteId) {
    const note = await getNote(db, user.id, noteId);
    if (!note || note.workspace_id !== workspaceId) {
      return jsonError(400, "That note is not in this workspace.");
    }
  }

  const width = Number(form.get("width")) || 0;
  const height = Number(form.get("height")) || 0;
  const title = (form.get("title") as string | null)?.slice(0, 200) || "Untitled drawing";

  const id = newId();
  const key = drawingKey(user.id, id);
  await putObject(key, await file.arrayBuffer(), "image/png");
  try {
    const drawing = await createDrawing(db, user.id, {
      id,
      workspaceId,
      noteId,
      title,
      r2Key: key,
      width,
      height
    });
    return Response.json({ drawing }, { status: 201 });
  } catch (err) {
    await deleteObject(key).catch(() => {});
    throw err;
  }
});

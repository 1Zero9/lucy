import { withUser, jsonError } from "@/lib/api";
import { getDb, newId } from "@/lib/db";
import { getWorkspace } from "@/lib/db/workspaces";
import { getNote } from "@/lib/db/notes";
import { listAttachments, createAttachment } from "@/lib/db/attachments";
import { attachmentKey, putObject, deleteObject } from "@/lib/storage/attachments";
import { ALLOWED_CONTENT_TYPES, MAX_ATTACHMENT_BYTES } from "@/lib/storage/limits";

export const GET = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");

  const q = new URL(request.url).searchParams;
  const attachments = await listAttachments(db, user.id, workspaceId, {
    noteId: q.get("noteId") ?? undefined,
    deleted: q.get("deleted") === "1"
  });
  return Response.json({ attachments });
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
  if (!(file instanceof File)) return jsonError(400, "No file provided.");

  const noteId = (form.get("noteId") as string | null)?.trim() || null;
  if (noteId) {
    const note = await getNote(db, user.id, noteId);
    if (!note || note.workspace_id !== workspaceId) {
      return jsonError(400, "That note is not in this workspace.");
    }
  }

  const contentType = file.type || "application/octet-stream";
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return jsonError(415, `Files of type "${contentType}" aren't supported.`);
  }
  if (file.size <= 0) return jsonError(400, "That file is empty.");
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return jsonError(413, "That file is larger than the 25 MB limit.");
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_ATTACHMENT_BYTES) {
    return jsonError(413, "That file is larger than the 25 MB limit.");
  }

  const id = newId();
  const key = attachmentKey(user.id, id);
  await putObject(key, bytes, contentType);

  try {
    const attachment = await createAttachment(db, user.id, {
      id,
      workspaceId,
      noteId,
      r2Key: key,
      filename: (file.name || "file").slice(0, 255),
      contentType,
      sizeBytes: bytes.byteLength
    });
    return Response.json({ attachment }, { status: 201 });
  } catch (err) {
    // Roll back the orphaned object if the metadata write fails.
    await deleteObject(key).catch(() => {});
    throw err;
  }
});

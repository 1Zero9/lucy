import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getWorkspace } from "@/lib/db/workspaces";
import { getModule } from "@/lib/db/modules";
import { getFolder } from "@/lib/db/folders";
import { listNotes, createNote, type NoteListOpts } from "@/lib/db/notes";
import { asObject, optionalString, noteText } from "@/lib/validation";

export const GET = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");

  const q = new URL(request.url).searchParams;
  const opts: NoteListOpts = { deleted: q.get("deleted") === "1" };
  const folder = q.get("folder");
  if (folder === "none") opts.folderId = null;
  else if (folder) opts.folderId = folder;
  const tag = q.get("tag");
  if (tag) opts.tagId = tag;

  return Response.json({ notes: await listNotes(db, user.id, workspaceId, opts) });
});

export const POST = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");

  const body = asObject(await readJsonBody(request));

  const moduleId = optionalString(body.moduleId, { field: "moduleId", max: 64 });
  if (moduleId) {
    const module = await getModule(db, user.id, moduleId);
    if (!module || module.workspace_id !== workspaceId) {
      return jsonError(400, "That module is not in this workspace.");
    }
  }

  const folderId = optionalString(body.folderId, { field: "folderId", max: 64 });
  if (folderId) {
    const folder = await getFolder(db, user.id, folderId);
    if (!folder || folder.workspace_id !== workspaceId) {
      return jsonError(400, "That folder is not in this workspace.");
    }
  }

  const note = await createNote(db, user.id, {
    workspaceId,
    moduleId,
    folderId,
    title: optionalString(body.title, { field: "Title", max: 200 }),
    text: noteText(body.text)
  });
  return Response.json({ note }, { status: 201 });
});

import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getWorkspace } from "@/lib/db/workspaces";
import { getModule } from "@/lib/db/modules";
import { listNotes, createNote } from "@/lib/db/notes";
import { asObject, optionalString, noteText } from "@/lib/validation";

export const GET = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");

  const deleted = new URL(request.url).searchParams.get("deleted") === "1";
  const notes = await listNotes(db, user.id, workspaceId, { deleted });
  return Response.json({ notes });
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

  const note = await createNote(db, user.id, {
    workspaceId,
    moduleId,
    title: optionalString(body.title, { field: "Title", max: 200 }),
    text: noteText(body.text)
  });
  return Response.json({ note }, { status: 201 });
});

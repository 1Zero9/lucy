import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getWorkspace } from "@/lib/db/workspaces";
import { getModule } from "@/lib/db/modules";
import { getNote } from "@/lib/db/notes";
import { listFlashcards, createFlashcard } from "@/lib/db/flashcards";
import { asObject, requiredString, optionalString } from "@/lib/validation";

export const GET = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");
  const q = new URL(request.url).searchParams;
  const cards = await listFlashcards(db, user.id, workspaceId, {
    deleted: q.get("deleted") === "1",
    moduleId: q.get("moduleId") ?? undefined,
    noteId: q.get("noteId") ?? undefined
  });
  return Response.json({ cards });
});

export const POST = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");

  const body = asObject(await readJsonBody(request));
  const moduleId = optionalString(body.moduleId, { field: "moduleId", max: 64 });
  if (moduleId) {
    const m = await getModule(db, user.id, moduleId);
    if (!m || m.workspace_id !== workspaceId) return jsonError(400, "That module is not in this workspace.");
  }
  const noteId = optionalString(body.noteId, { field: "noteId", max: 64 });
  if (noteId) {
    const n = await getNote(db, user.id, noteId);
    if (!n || n.workspace_id !== workspaceId) return jsonError(400, "That note is not in this workspace.");
  }

  const card = await createFlashcard(db, user.id, {
    workspaceId,
    front: requiredString(body.front, { field: "Front", max: 2000 }),
    back: requiredString(body.back, { field: "Back", max: 2000 }),
    moduleId,
    noteId
  });
  return Response.json({ card }, { status: 201 });
});

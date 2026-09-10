import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getWorkspace } from "@/lib/db/workspaces";
import { getModule } from "@/lib/db/modules";
import { getNote } from "@/lib/db/notes";
import { listResearch, createResearch, type ResearchKind } from "@/lib/db/research";
import { asObject, requiredString, optionalString, noteText } from "@/lib/validation";

const KINDS: ResearchKind[] = ["link", "book", "paper", "video", "other"];

export const GET = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");
  const q = new URL(request.url).searchParams;
  const items = await listResearch(db, user.id, workspaceId, {
    deleted: q.get("deleted") === "1",
    noteId: q.get("noteId") ?? undefined
  });
  return Response.json({ items });
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
  const kind = typeof body.kind === "string" && KINDS.includes(body.kind as ResearchKind)
    ? (body.kind as ResearchKind)
    : "link";

  const item = await createResearch(db, user.id, {
    workspaceId,
    title: requiredString(body.title, { field: "Title", max: 300 }),
    url: optionalString(body.url, { field: "URL", max: 2000 }),
    kind,
    annotation: noteText(body.annotation),
    moduleId,
    noteId
  });
  return Response.json({ item }, { status: 201 });
});

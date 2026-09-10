import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getWorkspace } from "@/lib/db/workspaces";
import { listFolders, createFolder } from "@/lib/db/folders";
import { asObject, requiredString } from "@/lib/validation";

export const GET = withUser(async (user, _request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");
  return Response.json({ folders: await listFolders(db, user.id, workspaceId) });
});

export const POST = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");

  const body = asObject(await readJsonBody(request));
  const folder = await createFolder(
    db,
    user.id,
    workspaceId,
    requiredString(body.name, { field: "Folder name", max: 80 })
  );
  return Response.json({ folder }, { status: 201 });
});

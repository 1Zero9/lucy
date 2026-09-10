import { withUser, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getWorkspace } from "@/lib/db/workspaces";
import { listTags } from "@/lib/db/tags";

export const GET = withUser(async (user, _request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");
  return Response.json({ tags: await listTags(db, user.id, workspaceId) });
});

import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getWorkspace } from "@/lib/db/workspaces";
import { listPeriods, createPeriod } from "@/lib/db/periods";
import { asObject, requiredString } from "@/lib/validation";

export const GET = withUser(async (user, _request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");
  const periods = await listPeriods(db, user.id, workspaceId);
  return Response.json({ periods });
});

export const POST = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");

  const body = asObject(await readJsonBody(request));
  const period = await createPeriod(db, user.id, {
    workspaceId,
    name: requiredString(body.name, { field: "Period name", max: 80 })
  });
  return Response.json({ period }, { status: 201 });
});

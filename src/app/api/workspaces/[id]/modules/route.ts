import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getWorkspace } from "@/lib/db/workspaces";
import { listModules, createModule } from "@/lib/db/modules";
import { asObject, requiredString, optionalString, optionalColour } from "@/lib/validation";

export const GET = withUser(async (user, _request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");
  const modules = await listModules(db, user.id, workspaceId);
  return Response.json({ modules });
});

export const POST = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");

  const body = asObject(await readJsonBody(request));
  const module = await createModule(db, user.id, {
    workspaceId,
    name: requiredString(body.name, { field: "Module name", max: 120 }),
    code: optionalString(body.code, { field: "Code", max: 40 }),
    description: optionalString(body.description, { field: "Description", max: 2000 }),
    colour: optionalColour(body.colour)
  });
  return Response.json({ module }, { status: 201 });
});

import { withUser, readJsonBody } from "@/lib/api";
import { getDb } from "@/lib/db";
import { listWorkspaces, createWorkspace } from "@/lib/db/workspaces";
import { asObject, requiredString, optionalString, optionalColour } from "@/lib/validation";

export const GET = withUser(async (user) => {
  const workspaces = await listWorkspaces(getDb(), user.id);
  return Response.json({ workspaces });
});

export const POST = withUser(async (user, request) => {
  const body = asObject(await readJsonBody(request));
  const workspace = await createWorkspace(getDb(), user.id, {
    name: requiredString(body.name, { field: "Workspace name", max: 120 }),
    purpose: optionalString(body.purpose, { field: "Purpose", max: 240 }),
    description: optionalString(body.description, { field: "Description", max: 2000 }),
    colour: optionalColour(body.colour)
  });
  return Response.json({ workspace }, { status: 201 });
});

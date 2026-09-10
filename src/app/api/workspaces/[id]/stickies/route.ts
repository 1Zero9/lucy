import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getWorkspace } from "@/lib/db/workspaces";
import { listStickies, createSticky } from "@/lib/db/stickies";
import { asObject, requiredString, optionalColour } from "@/lib/validation";

export const GET = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");
  const deleted = new URL(request.url).searchParams.get("deleted") === "1";
  return Response.json({ stickies: await listStickies(db, user.id, workspaceId, { deleted }) });
});

export const POST = withUser(async (user, request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");

  const body = asObject(await readJsonBody(request));
  const sticky = await createSticky(db, user.id, workspaceId, {
    body: requiredString(body.body, { field: "Sticky", max: 2000 }),
    colour: optionalColour(body.colour)
  });
  return Response.json({ sticky }, { status: 201 });
});

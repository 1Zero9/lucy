import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import {
  getWorkspace,
  updateWorkspace,
  softDeleteWorkspace
} from "@/lib/db/workspaces";
import { asObject, requiredString, optionalString, optionalColour } from "@/lib/validation";

export const GET = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const workspace = await getWorkspace(getDb(), user.id, id);
  if (!workspace) return jsonError(404, "Workspace not found.");
  return Response.json({ workspace });
});

export const PATCH = withUser(async (user, request, { params }) => {
  const { id } = await params;
  const body = asObject(await readJsonBody(request));
  const patch: Parameters<typeof updateWorkspace>[3] = {};
  if ("name" in body) patch.name = requiredString(body.name, { field: "Workspace name", max: 120 });
  if ("purpose" in body) patch.purpose = optionalString(body.purpose, { field: "Purpose", max: 240 });
  if ("description" in body) {
    patch.description = optionalString(body.description, { field: "Description", max: 2000 });
  }
  if ("colour" in body) patch.colour = optionalColour(body.colour);

  const workspace = await updateWorkspace(getDb(), user.id, id, patch);
  if (!workspace) return jsonError(404, "Workspace not found.");
  return Response.json({ workspace });
});

export const DELETE = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await softDeleteWorkspace(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Workspace not found.");
  return Response.json({ ok: true });
});

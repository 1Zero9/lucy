import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { renameFolder, softDeleteFolder } from "@/lib/db/folders";
import { asObject, requiredString } from "@/lib/validation";

export const PATCH = withUser(async (user, request, { params }) => {
  const { id } = await params;
  const body = asObject(await readJsonBody(request));
  const folder = await renameFolder(
    getDb(),
    user.id,
    id,
    requiredString(body.name, { field: "Folder name", max: 80 })
  );
  if (!folder) return jsonError(404, "Folder not found.");
  return Response.json({ folder });
});

export const DELETE = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await softDeleteFolder(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Folder not found.");
  return Response.json({ ok: true });
});

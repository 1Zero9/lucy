import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { updateModule, softDeleteModule } from "@/lib/db/modules";
import { asObject, requiredString, optionalString, optionalColour } from "@/lib/validation";

export const PATCH = withUser(async (user, request, { params }) => {
  const { id } = await params;
  const body = asObject(await readJsonBody(request));
  const patch: Parameters<typeof updateModule>[3] = {};
  if ("name" in body) patch.name = requiredString(body.name, { field: "Module name", max: 120 });
  if ("code" in body) patch.code = optionalString(body.code, { field: "Code", max: 40 });
  if ("description" in body) {
    patch.description = optionalString(body.description, { field: "Description", max: 2000 });
  }
  if ("colour" in body) {
    const colour = optionalColour(body.colour);
    if (colour) patch.colour = colour;
  }

  const module = await updateModule(getDb(), user.id, id, patch);
  if (!module) return jsonError(404, "Module not found.");
  return Response.json({ module });
});

export const DELETE = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await softDeleteModule(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Module not found.");
  return Response.json({ ok: true });
});

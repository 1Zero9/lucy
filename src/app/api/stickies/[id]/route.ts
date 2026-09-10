import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { updateSticky, softDeleteSticky } from "@/lib/db/stickies";
import { asObject, requiredString, optionalColour, ValidationError } from "@/lib/validation";

export const PATCH = withUser(async (user, request, { params }) => {
  const { id } = await params;
  const body = asObject(await readJsonBody(request));
  const patch: { body?: string; colour?: string | null } = {};
  if ("body" in body) patch.body = requiredString(body.body, { field: "Sticky", max: 2000 });
  if ("colour" in body) patch.colour = optionalColour(body.colour);
  if (patch.body === undefined && patch.colour === undefined) {
    throw new ValidationError("Nothing to update.");
  }
  const sticky = await updateSticky(getDb(), user.id, id, patch);
  if (!sticky) return jsonError(404, "Sticky not found.");
  return Response.json({ sticky });
});

export const DELETE = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await softDeleteSticky(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Sticky not found.");
  return Response.json({ ok: true });
});

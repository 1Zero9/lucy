import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { updateResearch, softDeleteResearch, type ResearchKind } from "@/lib/db/research";
import { asObject, requiredString, optionalString, noteText, ValidationError } from "@/lib/validation";

const KINDS: ResearchKind[] = ["link", "book", "paper", "video", "other"];

export const PATCH = withUser(async (user, request, { params }) => {
  const { id } = await params;
  const body = asObject(await readJsonBody(request));
  const patch: {
    title?: string;
    url?: string | null;
    kind?: ResearchKind;
    annotation?: string;
  } = {};
  if ("title" in body) patch.title = requiredString(body.title, { field: "Title", max: 300 });
  if ("url" in body) patch.url = optionalString(body.url, { field: "URL", max: 2000 });
  if ("annotation" in body) patch.annotation = noteText(body.annotation);
  if ("kind" in body) {
    if (typeof body.kind !== "string" || !KINDS.includes(body.kind as ResearchKind)) {
      throw new ValidationError("Invalid kind.");
    }
    patch.kind = body.kind as ResearchKind;
  }
  if (Object.keys(patch).length === 0) throw new ValidationError("Nothing to update.");

  const item = await updateResearch(getDb(), user.id, id, patch);
  if (!item) return jsonError(404, "Research item not found.");
  return Response.json({ item });
});

export const DELETE = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await softDeleteResearch(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Research item not found.");
  return Response.json({ ok: true });
});

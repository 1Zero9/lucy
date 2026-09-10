import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getFlashcard, updateFlashcard, softDeleteFlashcard } from "@/lib/db/flashcards";
import { getModule } from "@/lib/db/modules";
import { asObject, requiredString, optionalString, ValidationError } from "@/lib/validation";

export const GET = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const card = await getFlashcard(getDb(), user.id, id);
  if (!card) return jsonError(404, "Flashcard not found.");
  return Response.json({ card });
});

export const PATCH = withUser(async (user, request, { params }) => {
  const { id } = await params;
  const db = getDb();
  const card = await getFlashcard(db, user.id, id);
  if (!card) return jsonError(404, "Flashcard not found.");

  const body = asObject(await readJsonBody(request));
  const patch: { front?: string; back?: string; moduleId?: string | null } = {};
  if ("front" in body) patch.front = requiredString(body.front, { field: "Front", max: 2000 });
  if ("back" in body) patch.back = requiredString(body.back, { field: "Back", max: 2000 });
  if ("moduleId" in body) {
    const moduleId = optionalString(body.moduleId, { field: "moduleId", max: 64 });
    if (moduleId) {
      const m = await getModule(db, user.id, moduleId);
      if (!m || m.workspace_id !== card.workspace_id) {
        return jsonError(400, "That module is not in this workspace.");
      }
    }
    patch.moduleId = moduleId;
  }
  if (Object.keys(patch).length === 0) throw new ValidationError("Nothing to update.");

  const updated = await updateFlashcard(db, user.id, id, patch);
  if (!updated) return jsonError(404, "Flashcard not found.");
  return Response.json({ card: updated });
});

export const DELETE = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await softDeleteFlashcard(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Flashcard not found.");
  return Response.json({ ok: true });
});

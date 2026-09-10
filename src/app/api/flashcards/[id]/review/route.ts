import { withUser, readJsonBody, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { reviewFlashcard } from "@/lib/db/flashcards";
import { asObject, ValidationError } from "@/lib/validation";
import type { Grade } from "@/lib/srs";

const GRADES: Grade[] = ["again", "hard", "good", "easy"];

export const POST = withUser(async (user, request, { params }) => {
  const { id } = await params;
  const body = asObject(await readJsonBody(request));
  if (typeof body.grade !== "string" || !GRADES.includes(body.grade as Grade)) {
    throw new ValidationError("grade must be one of: again, hard, good, easy.");
  }
  const card = await reviewFlashcard(getDb(), user.id, id, body.grade as Grade);
  if (!card) return jsonError(404, "Flashcard not found.");
  return Response.json({ card });
});

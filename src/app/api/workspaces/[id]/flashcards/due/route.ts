import { withUser, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getWorkspace } from "@/lib/db/workspaces";
import { listDueFlashcards } from "@/lib/db/flashcards";

export const GET = withUser(async (user, _request, { params }) => {
  const { id: workspaceId } = await params;
  const db = getDb();
  const workspace = await getWorkspace(db, user.id, workspaceId);
  if (!workspace) return jsonError(404, "Workspace not found.");
  return Response.json({ cards: await listDueFlashcards(db, user.id, workspaceId) });
});

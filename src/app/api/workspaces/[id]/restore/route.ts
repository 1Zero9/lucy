import { withUser, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { restoreWorkspace } from "@/lib/db/workspaces";

export const POST = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await restoreWorkspace(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Nothing to restore.");
  return Response.json({ ok: true });
});

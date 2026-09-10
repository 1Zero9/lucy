import { withUser, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { restoreVersion } from "@/lib/db/notes";

export const POST = withUser(async (user, _request, { params }) => {
  const { id, version } = await params;
  const n = Number(version);
  if (!Number.isInteger(n) || n < 1) return jsonError(400, "Invalid version.");

  const note = await restoreVersion(getDb(), user.id, id, n);
  if (!note) return jsonError(404, "Note or version not found.");
  return Response.json({ note });
});

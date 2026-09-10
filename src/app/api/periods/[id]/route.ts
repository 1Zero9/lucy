import { withUser, jsonError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { softDeletePeriod } from "@/lib/db/periods";

export const DELETE = withUser(async (user, _request, { params }) => {
  const { id } = await params;
  const ok = await softDeletePeriod(getDb(), user.id, id);
  if (!ok) return jsonError(404, "Period not found.");
  return Response.json({ ok: true });
});

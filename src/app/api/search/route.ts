import { withUser } from "@/lib/api";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { search } from "@/lib/db/search";

export const GET = withUser(async (user, request) => {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return Response.json({ query: "", results: null });

  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) return Response.json({ query: q, results: null });

  const results = await search(getDb(), user.id, active.id, q);
  return Response.json({ query: q, workspace: active.name, results });
});

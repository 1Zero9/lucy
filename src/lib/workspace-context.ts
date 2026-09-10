import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { getWorkspace, listWorkspaces, type Workspace } from "@/lib/db/workspaces";

const COOKIE = "lucy_ws";

/**
 * The workspace the app is currently "in". Held in a cookie so it survives
 * navigation without a schema change; falls back to the most recently updated
 * workspace, and is always re-validated against the signed-in user so a stale
 * or borrowed id can never select someone else's workspace.
 */
export async function resolveActiveWorkspace(userId: string): Promise<{
  active: Workspace | null;
  all: Workspace[];
}> {
  const db = getDb();
  const all = await listWorkspaces(db, userId);
  if (all.length === 0) return { active: null, all };

  const jar = await cookies();
  const wanted = jar.get(COOKIE)?.value;
  const active =
    (wanted && all.find((w) => w.id === wanted)) ||
    (wanted ? await getWorkspace(db, userId, wanted) : null) ||
    all[0];

  return { active: active ?? all[0], all };
}

/** Set the active workspace. Only valid inside a server action or route handler. */
export async function setActiveWorkspace(id: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
}

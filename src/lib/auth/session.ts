import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
};

/**
 * Resolve the Better Auth session for the current request from its cookies.
 * Returns `null` when the caller is anonymous.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const u = session.user;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    emailVerified: Boolean(u.emailVerified),
    image: u.image ?? null
  };
}

/**
 * For server components / pages: require a signed-in user or send the browser
 * to the login screen. The authenticated user id must always come from here,
 * never from a client-supplied value (SECURITY.md).
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * For route handlers: return the user or a 401 Response to bail out with.
 *
 *   const result = await requireApiUser();
 *   if (result instanceof Response) return result;
 *   // result is the authenticated user
 */
export async function requireApiUser(): Promise<SessionUser | Response> {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return user;
}

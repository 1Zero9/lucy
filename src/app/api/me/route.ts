import { requireApiUser } from "@/lib/auth/session";

/**
 * Minimal authenticated endpoint. Used by the app shell and by the Phase 1A
 * anonymous-access security tests. The user is derived from the session only.
 */
export async function GET() {
  const user = await requireApiUser();
  if (user instanceof Response) return user;

  return Response.json({
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified
  });
}

import { getAuth } from "@/lib/auth/auth";

/**
 * Better Auth request handler. Serves sign-up, sign-in, sign-out, session and
 * all other Better Auth endpoints under /api/auth/*.
 */
function handler(request: Request): Promise<Response> {
  return getAuth().handler(request);
}

export { handler as GET, handler as POST };

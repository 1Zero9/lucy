import { ValidationError } from "./validation";
import { requireApiUser, type SessionUser } from "./auth/session";

export function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}

/**
 * Wrap a route handler: resolves the authenticated user (401 if anonymous),
 * turns {@link ValidationError} into 400, and anything else into a safe 500
 * (no internal detail leaks to the client — SECURITY.md).
 */
export function withUser(
  fn: (user: SessionUser, request: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>
) {
  return async (request: Request, ctx: { params: Promise<Record<string, string>> }): Promise<Response> => {
    const user = await requireApiUser();
    if (user instanceof Response) return user;
    try {
      return await fn(user, request, ctx);
    } catch (err) {
      if (err instanceof ValidationError) return jsonError(400, err.message);
      console.error("[api] unhandled error", err);
      return jsonError(500, "Something went wrong.");
    }
  };
}

/**
 * Conflict rule for note writes (used on the server for the 409 decision and
 * conceptually on the client).
 *
 * An offline / queued edit carries the `updated_at` it was made against
 * (`baseUpdatedAt`). If the note has moved on since then, another device wrote
 * to it — that is a conflict. When there is no base (a create, or a client that
 * never saw a server copy) there is nothing to conflict with.
 */
export function isConflict(
  baseUpdatedAt: string | null | undefined,
  serverUpdatedAt: string
): boolean {
  if (!baseUpdatedAt) return false;
  const base = Date.parse(baseUpdatedAt);
  const server = Date.parse(serverUpdatedAt);
  if (Number.isNaN(base) || Number.isNaN(server)) return false;
  return server > base;
}

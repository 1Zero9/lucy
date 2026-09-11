/**
 * Turn a caught client-side error into calm, specific copy
 * (docs/LUCY_STYLE_GUIDE.md §28 — never surface raw technical detail).
 *
 * A network-level failure (offline, DNS, connection refused) rejects `fetch()`
 * itself with a native `TypeError` in every browser — "Failed to fetch"
 * (Chrome), "NetworkError when attempting to fetch resource." (Firefox),
 * "Load failed" (Safari). Everything else reaching a catch block here is
 * already a friendly message our own API layer threw (`new Error(body.error)`).
 */
export function friendlyError(err: unknown): string {
  if (err instanceof TypeError) {
    return "Couldn't reach LUCY. Check your connection and try again.";
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong.";
}

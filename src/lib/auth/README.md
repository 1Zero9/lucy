# Authentication layer

LUCY uses **Better Auth** (`better-auth`) with the Cloudflare D1 binding. No custom
password hashing, session tokens or email verification logic — see MASTER.md §4.

## Files

- `auth.ts` — lazy `getAuth()` server instance. Better Auth 1.7 auto-detects the
  D1 binding, uses its built-in D1 Kysely dialect, and disables interactive
  transactions (D1 has none). Tables are pluralised (`users`, `sessions`,
  `accounts`, `verifications`) and columns mapped to snake_case via `fields`.
  Requires `BETTER_AUTH_SECRET` (`.dev.vars` locally, Wrangler secret when deployed).
- `session.ts` — `getSessionUser()`, `requireUser()` (pages: redirect to `/login`),
  `requireApiUser()` (route handlers: returns a 401 `Response` to bail with).
  The authenticated user id comes only from here, never from client input
  (SECURITY.md).
- `client.ts` — browser `authClient` (`better-auth/react`), same-origin.

## Wiring

- `src/app/api/auth/[...all]/route.ts` — Better Auth request handler (all
  `/api/auth/*` endpoints).
- Schema: `migrations/0002_auth.sql`.

## Tests

`scripts/auth-e2e.mjs` (`npm run test:e2e`, needs `npm run dev` running) covers
anonymous rejection, malformed cookies, two independent accounts, and sign-out.

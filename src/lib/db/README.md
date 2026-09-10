# Database layer

Keep D1 queries here. `index.ts` exports `getDb()` (the `env.DB` handle),
`newId()` and `nowIso()`; each query module (`workspaces.ts`, `modules.ts`,
`periods.ts`) takes `(db, userId, …)`.

Rules:
- Authorisation is server-side. Every user-owned query carries `WHERE user_id = ?`
  with the id from the authenticated session — never a browser-provided owner id.
- Cross-resource writes re-check ownership of the parent first (e.g. creating a
  module loads the workspace via `getWorkspace(db, userId, …)`).
- Important user content is soft-deleted (`deleted_at`) with a `restore*` counterpart.
- All schema changes use `/migrations`.

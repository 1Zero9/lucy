# R2 storage layer

Files belong in R2 (the `FILES` binding), metadata belongs in D1 (`attachments`).

- `attachments.ts` — `getFiles()`, `attachmentKey(userId, id)` (key is derived
  from ids; authority is always the D1 row), `putObject` / `getObject` /
  `deleteObject`.
- `limits.ts` — 25 MB cap, content-type allowlist, and `contentDisposition()`
  (images / PDF / plain text render inline; everything else downloads).
- DB access is in `src/lib/db/attachments.ts`.

R2 objects stay private. Before serving one (`/api/attachments/[id]/download`):

1. resolve the session user (`withUser`)
2. load the attachment with an owner-scoped D1 query (`getAttachment`)
3. use the **stored** `r2_key` from that row — never a client-supplied key
4. stream with `Content-Type` from the row, `Cache-Control: private, no-store`,
   `X-Content-Type-Options: nosniff`

Permanent purge deletes the R2 object as well as the row.

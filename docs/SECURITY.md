# LUCY Security Requirements

## Threat model for v1

Primary concerns:
- one user accessing another user's data
- session theft/misuse
- accidental data deletion
- accidental overwrite
- insecure file URLs
- secrets committed to source
- development code modifying production data
- injection/input handling bugs

## Authorisation rule

Every user-owned query must include the authenticated account owner on the server side.

Resource IDs are locators, not authorisation.

Example:

```sql
SELECT *
FROM notes
WHERE id = ?
  AND user_id = ?
  AND deleted_at IS NULL;
```

The second parameter comes from the validated session.

## Browser trust

Never trust from the browser:
- `user_id`
- file ownership
- account role
- storage key
- permission flags

## R2

- Bucket is private.
- Generate/stream access through authenticated server logic.
- Validate ownership from D1 before retrieval.
- Never use raw client-provided R2 keys as authority.

## Secrets

- `.dev.vars` is ignored by Git.
- Production secrets use Wrangler secrets/Cloudflare controls.
- Never put secrets in `NEXT_PUBLIC_*`.
- Never echo secrets in logs.

## Errors

Client receives safe errors.
Do not display:
- SQL
- internal D1 errors
- stack traces in production
- R2 keys
- tokens/session values

## Destructive operations

Notes:
- soft-delete
- restore available
- permanent purge separated from ordinary Delete

Account deletion:
- explicit confirmation
- later implementation should define retention/purge behaviour

## Testing

Security tests should include:
- anonymous note request -> denied
- User A note ID requested as User B -> not returned
- guessed attachment ID -> not returned
- malformed IDs -> safe validation failure

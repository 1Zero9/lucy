# Database layer

Keep D1 queries here.

Rules:
- Authorisation is server-side.
- User-owned queries accept the authenticated user ID from trusted auth code.
- Do not accept a browser-provided owner ID as authority.
- All schema changes use `/migrations`.

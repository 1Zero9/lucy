-- Phase 3 — files.
--
-- Attachment *metadata* lives in D1; the bytes live in the R2 bucket bound as
-- FILES (docs/ARCHITECTURE.md). `r2_key` is generated server-side and is never
-- accepted from the client — every download re-derives it from an owner-scoped
-- row (docs/SECURITY.md, src/lib/storage/README.md).
--
-- Conventions match the rest of the schema: TEXT UUID ids, ISO-8601 TEXT
-- timestamps, soft delete via `deleted_at`, owner-scoped indexes.

CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  note_id TEXT,
  r2_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
);

CREATE INDEX idx_attachments_owner_workspace
ON attachments(user_id, workspace_id, deleted_at, created_at DESC);

CREATE INDEX idx_attachments_owner_note
ON attachments(user_id, note_id, deleted_at, created_at DESC);

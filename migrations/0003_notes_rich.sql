-- Phase 2 — rich note experience.
--
-- Adds the "Later" primitives that Phase 2 needs (DATA_MODEL.md):
--   * folders          — optional lightweight bucket inside a workspace
--   * tags / note_tags  — workspace-scoped labels, many-to-many with notes
--   * notes.folder_id   — a note optionally lives in one folder
--
-- Note colour (`notes.colour`) and pin (`notes.is_pinned`) columns already
-- exist from 0001 and are surfaced by the app in this phase — no change here.
-- Conventions match the rest of the schema: TEXT UUID ids, ISO-8601 TEXT
-- timestamps, soft delete via `deleted_at`, owner-scoped indexes.

CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_folders_owner_workspace
ON folders(user_id, workspace_id, deleted_at, sort_order);

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  colour TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- One tag name per workspace, case-insensitive.
CREATE UNIQUE INDEX idx_tags_owner_workspace_name
ON tags(user_id, workspace_id, name COLLATE NOCASE);

CREATE TABLE note_tags (
  note_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_note_tags_tag ON note_tags(tag_id);
CREATE INDEX idx_note_tags_owner ON note_tags(user_id, note_id);

ALTER TABLE notes ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL;

CREATE INDEX idx_notes_owner_folder
ON notes(user_id, folder_id, deleted_at, updated_at DESC);

-- Phase 6 — learning tools.
--
-- research_items : a saved source/reference with a Markdown annotation
-- flashcards     : prompt/answer unit with light SM-2 spaced-repetition state
-- drawings       : sketch/handwriting object; the PNG lives in the R2 FILES
--                  bucket (like attachments), metadata here
--
-- Search is query-time only (owner-scoped LIKE across existing tables) and adds
-- no schema. Conventions match the rest of the schema: TEXT UUID ids, ISO-8601
-- TEXT timestamps, soft delete via `deleted_at`, owner-scoped indexes.

CREATE TABLE research_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  module_id TEXT,
  note_id TEXT,
  title TEXT NOT NULL,
  url TEXT,
  kind TEXT NOT NULL DEFAULT 'link'
    CHECK (kind IN ('link', 'book', 'paper', 'video', 'other')),
  annotation TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
);

CREATE INDEX idx_research_owner_workspace
ON research_items(user_id, workspace_id, deleted_at, updated_at DESC);

CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  module_id TEXT,
  note_id TEXT,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  ease REAL NOT NULL DEFAULT 2.5,
  interval_days REAL NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  due_at TEXT,
  last_reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
);

CREATE INDEX idx_flashcards_owner_due
ON flashcards(user_id, workspace_id, deleted_at, due_at);

CREATE INDEX idx_flashcards_owner_module
ON flashcards(user_id, module_id, deleted_at);

CREATE TABLE drawings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  note_id TEXT,
  title TEXT NOT NULL DEFAULT 'Untitled drawing',
  r2_key TEXT NOT NULL UNIQUE,
  width INTEGER NOT NULL DEFAULT 0,
  height INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
);

CREATE INDEX idx_drawings_owner_workspace
ON drawings(user_id, workspace_id, deleted_at, updated_at DESC);

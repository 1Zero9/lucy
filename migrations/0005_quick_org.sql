-- Phase 4 — quick organisation.
--
-- stickies : fast temporary capture inside a workspace (PRODUCT_SPEC.md).
-- tasks    : an action with an optional due date and an optional in-app
--            reminder time. LUCY does not deliver reminders yet (no push /
--            email); `remind_at` only drives what the due views surface.
--
-- Conventions match the rest of the schema: TEXT UUID ids, ISO-8601 TEXT
-- timestamps, soft delete via `deleted_at`, owner-scoped indexes.

CREATE TABLE stickies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  colour TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_stickies_owner_workspace
ON stickies(user_id, workspace_id, deleted_at, sort_order, updated_at DESC);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  module_id TEXT,
  note_id TEXT,
  title TEXT NOT NULL,
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  due_at TEXT,
  remind_at TEXT,
  completed_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_owner_due
ON tasks(user_id, workspace_id, deleted_at, status, due_at);

CREATE INDEX idx_tasks_owner_note
ON tasks(user_id, note_id, deleted_at);

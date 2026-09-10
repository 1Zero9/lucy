-- Phase 1A — identity.
--
-- Migration 0001 created placeholder `users` / `user_settings` tables before an
-- auth library was chosen. LUCY now uses Better Auth (see MASTER.md §4), which
-- owns the identity tables. This migration replaces those placeholders with the
-- Better Auth core schema (email + password).
--
-- The identity table keeps the name `users`, so the foreign keys already declared
-- by workspaces / periods / modules / notes / note_versions (REFERENCES users(id))
-- stay valid without rebuilding those tables. Better Auth is pointed at the
-- plural table names via `modelName` in src/lib/auth/auth.ts.
--
-- Column conventions for the Better Auth tables follow that library's Kysely
-- SQLite adapter: booleans are stored as 0/1 INTEGER, dates as ISO-8601 TEXT
-- (the adapter runs with supportsDates=false / supportsBooleans=false for
-- SQLite/D1). This matches the ISO-8601 TEXT timestamps used in 0001.

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  image TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_users_email ON users(email);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TEXT,
  refresh_token_expires_at TEXT,
  scope TEXT,
  password TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_accounts_provider ON accounts(provider_id, account_id);

CREATE TABLE verifications (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_verifications_identifier ON verifications(identifier);
CREATE INDEX idx_verifications_expires ON verifications(expires_at);

-- App-level per-user preferences (LUCY-owned, not Better Auth). Recreated here
-- against the new `users` table; shape is unchanged from 0001.
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY,
  appearance TEXT NOT NULL DEFAULT 'system'
    CHECK (appearance IN ('light', 'dark', 'system')),
  accent_colour TEXT NOT NULL DEFAULT '#7C3AED',
  font_scale INTEGER NOT NULL DEFAULT 100
    CHECK (font_scale BETWEEN 80 AND 150),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

PRAGMA foreign_keys = ON;

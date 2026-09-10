import { env } from "cloudflare:workers";

/** The D1 handle. Query modules in this folder take it as their first argument. */
export function getDb(): D1Database {
  return env.DB;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

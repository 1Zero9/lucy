export interface CloudflareEnv {
  DB: D1Database;
  FILES: R2Bucket;
  /** Better Auth signing secret. Local: .dev.vars. Deployed: `wrangler secret put`. */
  BETTER_AUTH_SECRET?: string;
  /** Public base URL of the deployment, e.g. http://localhost:3001. Optional. */
  BETTER_AUTH_URL?: string;
}

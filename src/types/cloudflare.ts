export interface CloudflareEnv {
  DB: D1Database;
  FILES: R2Bucket;
  /** Better Auth signing secret. Local: .dev.vars. Deployed: `wrangler secret put`. */
  BETTER_AUTH_SECRET?: string;
  /** Public base URL of the deployment, e.g. http://localhost:3001. Optional. */
  BETTER_AUTH_URL?: string;
  /** Resend API key. Without it, email sending safely no-ops (src/lib/email/resend.ts). */
  RESEND_API_KEY?: string;
  /** Verified Resend sender, e.g. "LUCY <noreply@1zero9.com>". Optional, has a default. */
  EMAIL_FROM?: string;
}

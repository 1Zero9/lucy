import { env } from "cloudflare:workers";

/**
 * Which deployment this request is running in. Backed by the plain (non-secret)
 * `APP_ENV` var in wrangler.jsonc — "production" at the top level, "dev" in
 * env.dev, and "dev" in .dev.vars for local `npm run dev`. Anything other than
 * the literal "production" is treated as non-production, so a missing/typo'd
 * value fails safe toward showing the dev indicator rather than hiding it.
 */
export function isProductionEnv(): boolean {
  return env.APP_ENV === "production";
}

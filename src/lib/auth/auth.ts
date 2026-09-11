import { betterAuth } from "better-auth";
import { env } from "cloudflare:workers";
import { sendEmail } from "@/lib/email/resend";
import { verificationEmail } from "@/lib/email/templates";

/**
 * Better Auth server instance (see MASTER.md §4 — maintained auth library, no
 * custom password/session code).
 *
 * D1 bindings only exist inside a request, so the instance is built lazily on
 * first use and then reused for the lifetime of the Worker isolate. Better Auth
 * 1.7 detects the D1 binding automatically, uses its built-in D1 Kysely dialect,
 * and disables interactive transactions (D1 does not support them).
 *
 * Table names are pluralised to match the rest of the LUCY schema; column names
 * are mapped to snake_case (migration 0002_auth.sql).
 */
function build() {
  const secret = env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET is not set. Add it to .dev.vars for local development " +
        "or as a Wrangler secret for deployed environments."
    );
  }

  return betterAuth({
    secret,
    baseURL: env.BETTER_AUTH_URL || undefined,
    database: env.DB,
    emailAndPassword: {
      enabled: true,
      // Sending is wired (Resend, src/lib/email/), but signing in does not yet
      // require a verified email — flip this once RESEND_API_KEY is set and
      // the flow has been exercised end to end. See MASTER.md §8.
      requireEmailVerification: false,
      minPasswordLength: 10
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        const { subject, text, html } = verificationEmail(url);
        await sendEmail({ to: user.email, subject, text, html });
      }
    },
    user: {
      modelName: "users",
      fields: {
        emailVerified: "email_verified",
        createdAt: "created_at",
        updatedAt: "updated_at"
      }
    },
    session: {
      modelName: "sessions",
      fields: {
        userId: "user_id",
        expiresAt: "expires_at",
        ipAddress: "ip_address",
        userAgent: "user_agent",
        createdAt: "created_at",
        updatedAt: "updated_at"
      }
    },
    account: {
      modelName: "accounts",
      fields: {
        userId: "user_id",
        accountId: "account_id",
        providerId: "provider_id",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        idToken: "id_token",
        accessTokenExpiresAt: "access_token_expires_at",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at"
      }
    },
    verification: {
      modelName: "verifications",
      fields: {
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at"
      }
    }
  });
}

let instance: ReturnType<typeof build> | undefined;

export function getAuth(): ReturnType<typeof build> {
  return (instance ??= build());
}

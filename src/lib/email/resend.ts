import { env } from "cloudflare:workers";

/**
 * Minimal Resend client — a plain `fetch` against Resend's REST API, no SDK
 * dependency (MASTER.md — keep dependencies modest). Requires the `RESEND_API_KEY`
 * secret; without it, sending safely no-ops (logged) rather than throwing, so
 * local dev and any environment without the key still works — email is an
 * enhancement, not a blocker for signing in.
 */
export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const DEFAULT_FROM = "LUCY <noreply@1zero9.com>";

export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean }> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipped sending "${input.subject}" to ${input.to}`);
    return { sent: false };
  }

  const from = env.EMAIL_FROM || DEFAULT_FROM;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[email] Resend send failed (${res.status}): ${body.slice(0, 300)}`);
    return { sent: false };
  }
  return { sent: true };
}

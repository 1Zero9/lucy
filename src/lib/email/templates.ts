/**
 * Calm, short, specific copy (docs/LUCY_STYLE_GUIDE.md §28) — no "Oops!",
 * no unnecessary AI language. Shared wrapper keeps every transactional email
 * on-brand (logo, primary colour, restrained layout) without duplicating
 * markup per message.
 */

const PRIMARY = "#7C3AED";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

/** Logo URL is derived from the link's own origin, so a dev-sent email points
 *  at the dev icon and a production-sent one at the production icon. */
function logoUrlFrom(url: string): string {
  try {
    return `${new URL(url).origin}/icons/lucy-app-icon-64.png`;
  } catch {
    return "https://lucy.1zero9.com/icons/lucy-app-icon-64.png";
  }
}

function layout(opts: { url: string; heading: string; bodyHtml: string; cta: string; footnote: string }): string {
  const logo = logoUrlFrom(opts.url);
  return `
<div style="background:#F8FAFC;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:440px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
    <div style="padding:28px 32px 0;">
      <img src="${logo}" width="32" height="32" alt="LUCY" style="display:block;border-radius:8px;" />
    </div>
    <div style="padding:20px 32px 32px;">
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:${TEXT};">${opts.heading}</h1>
      <div style="font-size:14px;line-height:1.6;color:${TEXT};">${opts.bodyHtml}</div>
      <div style="margin:24px 0;">
        <a href="${opts.url}"
           style="display:inline-block;background:${PRIMARY};color:#ffffff;text-decoration:none;
                  font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;">
          ${opts.cta}
        </a>
      </div>
      <p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED};">${opts.footnote}</p>
    </div>
  </div>
  <p style="max-width:440px;margin:16px auto 0;text-align:center;font-size:12px;color:${MUTED};">LUCY — your private learning workspace</p>
</div>
`.trim();
}

export function verificationEmail(url: string) {
  const subject = "Verify your email for LUCY";
  const text = `Confirm your email to finish setting up LUCY.\n\n${url}\n\nIf you didn't create a LUCY account, you can ignore this email.`;
  const html = layout({
    url,
    heading: "Confirm your email",
    bodyHtml: "One click to finish setting up your LUCY account.",
    cta: "Verify email",
    footnote: "If you didn't create a LUCY account, you can safely ignore this email."
  });
  return { subject, text, html };
}

export function resetPasswordEmail(url: string) {
  const subject = "Reset your LUCY password";
  const text = `We received a request to reset your LUCY password.\n\n${url}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.`;
  const html = layout({
    url,
    heading: "Reset your password",
    bodyHtml: "We received a request to reset your LUCY password. This link expires in 1 hour.",
    cta: "Choose a new password",
    footnote: "If you didn't request this, you can safely ignore this email — your password won't change."
  });
  return { subject, text, html };
}

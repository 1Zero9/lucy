/**
 * Calm, short, specific copy (docs/LUCY_STYLE_GUIDE.md §28) — no "Oops!",
 * no unnecessary AI language.
 */
export function verificationEmail(url: string) {
  const subject = "Verify your email for LUCY";
  const text = `Confirm your email to finish setting up LUCY.\n\n${url}\n\nIf you didn't create a LUCY account, you can ignore this email.`;
  const html = `
    <p>Confirm your email to finish setting up LUCY.</p>
    <p><a href="${url}">Verify email</a></p>
    <p style="color:#64748B;font-size:13px;">If you didn't create a LUCY account, you can ignore this email.</p>
  `.trim();
  return { subject, text, html };
}

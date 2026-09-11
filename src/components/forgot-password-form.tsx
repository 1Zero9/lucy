"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";

function messageFor(code: string | undefined, fallback: string): string {
  // No code at all means the request never reached the server — a raw
  // network failure, not a validation error.
  if (!code) return "Couldn't reach LUCY. Check your connection and try again.";
  return fallback || "Could not send the reset link.";
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const { error: authError } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (authError) {
      setError(messageFor(authError.code, authError.message ?? ""));
      setBusy(false);
      return;
    }
    // Always show the same success state regardless of whether the email
    // exists — the server itself doesn't reveal that either, to avoid
    // leaking which addresses have an account.
    setSent(true);
    setBusy(false);
  }

  if (sent) {
    return (
      <div className="auth-card">
        <img className="auth-mark" src="/icons/lucy-app-icon-64.png" alt="" width={40} height={40} />
        <h1>Check your inbox</h1>
        <p className="sub">
          If <strong>{email.trim()}</strong> has a LUCY account, we&rsquo;ve sent a link to reset
          its password.
        </p>
        <Link className="btn" href="/login" style={{ textAlign: "center", textDecoration: "none" }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="auth-card" onSubmit={onSubmit} noValidate>
      <img className="auth-mark" src="/icons/lucy-app-icon-64.png" alt="" width={40} height={40} />
      <h1>Reset your password</h1>
      <p className="sub">Enter your email and we&rsquo;ll send you a reset link.</p>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Sending…" : "Send reset link"}
      </button>

      <p className="auth-alt">
        <Link href="/login">Back to sign in</Link>
      </p>
    </form>
  );
}

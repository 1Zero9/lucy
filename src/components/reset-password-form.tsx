"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";

function messageFor(code: string | undefined, fallback: string): string {
  if (code === "INVALID_TOKEN") return "This reset link has expired or was already used. Request a new one.";
  if (code === "PASSWORD_TOO_SHORT") return "Password must be at least 10 characters.";
  if (!code) return "Couldn't reach LUCY. Check your connection and try again.";
  return fallback || "Could not reset your password.";
}

export function ResetPasswordForm({ token }: { token: string | undefined }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }
    setBusy(true);
    setError(null);

    const { error: authError } = await authClient.resetPassword({ newPassword: password, token });
    if (authError) {
      setError(messageFor(authError.code, authError.message ?? ""));
      setBusy(false);
      return;
    }
    setDone(true);
    setBusy(false);
  }

  if (!token) {
    return (
      <div className="auth-card">
        <img className="auth-mark" src="/icons/lucy-app-icon-64.png" alt="" width={40} height={40} />
        <h1>Link expired</h1>
        <p className="sub">
          This reset link is missing or incomplete. Request a new one from the sign-in page.
        </p>
        <Link
          className="btn"
          href="/forgot-password"
          style={{ textAlign: "center", textDecoration: "none" }}
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-card">
        <img className="auth-mark" src="/icons/lucy-app-icon-64.png" alt="" width={40} height={40} />
        <h1>Password updated</h1>
        <p className="sub">Your password has been reset. Sign in with your new password.</p>
        <button className="btn" type="button" onClick={() => router.push("/login")}>
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <form className="auth-card" onSubmit={onSubmit} noValidate>
      <img className="auth-mark" src="/icons/lucy-app-icon-64.png" alt="" width={40} height={40} />
      <h1>Choose a new password</h1>
      <p className="sub">At least 10 characters.</p>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="password">New password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save new password"}
      </button>

      <p className="auth-alt">
        <Link href="/login">Back to sign in</Link>
      </p>
    </form>
  );
}

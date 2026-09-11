"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signUp } from "@/lib/auth/client";

type Mode = "login" | "signup";

function messageFor(mode: Mode, code: string | undefined, fallback: string): string {
  if (code === "INVALID_EMAIL_OR_PASSWORD") return "That email and password do not match.";
  if (code === "USER_ALREADY_EXISTS") return "An account with that email already exists.";
  if (code === "PASSWORD_TOO_SHORT") return "Password must be at least 10 characters.";
  if (code === "EMAIL_NOT_VERIFIED")
    return "Check your inbox — we've sent a link to verify your email before you can sign in.";
  // No code at all means the request never reached the server — a raw network
  // failure, not a validation error. Don't surface the browser's own message.
  if (!code) return "Couldn't reach LUCY. Check your connection and try again.";
  return fallback || (mode === "login" ? "Could not sign in." : "Could not create your account.");
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (isSignup) {
      const { data, error: authError } = await signUp.email({
        name: name.trim(),
        email: email.trim(),
        password
      });
      if (authError) {
        setError(messageFor(mode, authError.code, authError.message ?? ""));
        setBusy(false);
        return;
      }
      // Email verification is required — sign-up creates the account but does
      // not start a session until the link is clicked. Without this check the
      // page would silently redirect to "/" and bounce straight back to
      // /login with no explanation.
      if (!data?.token) {
        setAwaitingVerification(true);
        setBusy(false);
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    const { error: authError } = await signIn.email({ email: email.trim(), password });
    if (authError) {
      setError(messageFor(mode, authError.code, authError.message ?? ""));
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (awaitingVerification) {
    return (
      <div className="auth-card">
        <img className="auth-mark" src="/icons/lucy-app-icon-64.png" alt="" width={40} height={40} />
        <h1>Check your inbox</h1>
        <p className="sub">
          We&rsquo;ve sent a verification link to <strong>{email.trim()}</strong>. Click it to
          finish creating your account, then sign in.
        </p>
        <Link className="btn" href="/login" style={{ textAlign: "center", textDecoration: "none" }}>
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="auth-card" onSubmit={onSubmit} noValidate>
      <img className="auth-mark" src="/icons/lucy-app-icon-64.png" alt="" width={40} height={40} />
      <h1>{isSignup ? "Create your account" : "Sign in to LUCY"}</h1>
      <p className="sub">
        {isSignup ? "Your private learning workspace." : "Welcome back."}
      </p>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {isSignup ? (
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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

      <div className="field">
        <div className="field-label-row">
          <label htmlFor="password">Password</label>
          {!isSignup ? (
            <Link href="/forgot-password" className="linkish">
              Forgot password?
            </Link>
          ) : null}
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button className="btn" type="submit" disabled={busy}>
        {busy
          ? isSignup
            ? "Creating account…"
            : "Signing in…"
          : isSignup
            ? "Create account"
            : "Sign in"}
      </button>

      <p className="auth-alt">
        {isSignup ? (
          <>
            Already have an account? <Link href="/login">Sign in</Link>
          </>
        ) : (
          <>
            New to LUCY? <Link href="/signup">Create an account</Link>
          </>
        )}
      </p>
    </form>
  );
}

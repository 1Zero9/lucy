// Phase 1A identity / anonymous-access security checks.
//
// Runs against a live dev server (default http://localhost:3001). Start it with
// `npm run dev` in another terminal, then: `npm run test:e2e`.
// Override the target with BASE_URL=... if needed.
//
// No test framework dependency — uses the Node built-in test runner.

import test from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const stamp = Date.now();
const userA = { name: "User A", email: `a+${stamp}@example.test`, password: "correct horse staple" };
const userB = { name: "User B", email: `b+${stamp}@example.test`, password: "another long secret!!" };

/** Collect Set-Cookie values into a single Cookie header string. */
function jar() {
  const cookies = new Map();
  return {
    absorb(res) {
      const raw = res.headers.getSetCookie?.() ?? [];
      for (const c of raw) {
        const [pair] = c.split(";");
        const eq = pair.indexOf("=");
        cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    },
    header() {
      return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    }
  };
}

// Browsers always send Origin on state-changing requests; Better Auth's CSRF
// check requires it. Mirror that here.
const POST_HEADERS = { "content-type": "application/json", origin: BASE };

async function signUp(user) {
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: POST_HEADERS,
    body: JSON.stringify(user)
  });
  return res;
}

async function me(cookieHeader) {
  return fetch(`${BASE}/api/me`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {}
  });
}

test("anonymous request to a protected endpoint is rejected", async () => {
  const res = await me();
  assert.equal(res.status, 401);
});

test("a garbage session cookie is rejected, not honoured", async () => {
  const res = await me("better-auth.session_token=not-a-real-token");
  assert.equal(res.status, 401);
});

test("two accounts can be created and authenticate independently", async () => {
  const a = jar();
  const b = jar();

  const ra = await signUp(userA);
  assert.ok(ra.ok, `sign-up A failed: ${ra.status} ${await ra.text()}`);
  a.absorb(ra);

  const rb = await signUp(userB);
  assert.ok(rb.ok, `sign-up B failed: ${rb.status} ${await rb.text()}`);
  b.absorb(rb);

  const meA = await me(a.header());
  const meB = await me(b.header());
  assert.equal(meA.status, 200);
  assert.equal(meB.status, 200);

  const bodyA = await meA.json();
  const bodyB = await meB.json();
  assert.equal(bodyA.email, userA.email);
  assert.equal(bodyB.email, userB.email);
  assert.notEqual(bodyA.id, bodyB.id, "the two accounts must have distinct ids");

  // A's cookie keeps returning A even after B exists — no cross-account bleed.
  const meAagain = await me(a.header());
  assert.equal((await meAagain.json()).email, userA.email);
});

test("signing out invalidates the session", async () => {
  const a = jar();
  const ra = await signUp({
    name: "User C",
    email: `c+${stamp}@example.test`,
    password: "yet another secret pw"
  });
  assert.ok(ra.ok, `sign-up C failed: ${ra.status}`);
  a.absorb(ra);

  assert.equal((await me(a.header())).status, 200);

  const out = await fetch(`${BASE}/api/auth/sign-out`, {
    method: "POST",
    headers: { ...POST_HEADERS, cookie: a.header() },
    body: "{}"
  });
  assert.ok(out.ok, `sign-out failed: ${out.status}`);
  a.absorb(out);

  assert.equal((await me(a.header())).status, 401);
});

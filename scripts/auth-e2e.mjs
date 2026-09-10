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

function authed(cookieHeader) {
  return (path, init = {}) =>
    fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        origin: BASE,
        cookie: cookieHeader,
        ...(init.headers ?? {})
      }
    });
}

async function signUpJar(suffix) {
  const j = jar();
  const res = await signUp({
    name: `User ${suffix}`,
    email: `${suffix}+${stamp}@example.test`,
    password: "a-sufficiently-long-password"
  });
  assert.ok(res.ok, `sign-up ${suffix} failed: ${res.status} ${await res.text()}`);
  j.absorb(res);
  return j;
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

test("workspaces and modules are private to their owner", async () => {
  const a = authed((await signUpJar("wa")).header());
  const b = authed((await signUpJar("wb")).header());

  // Anonymous cannot list workspaces.
  assert.equal((await fetch(`${BASE}/api/workspaces`)).status, 401);

  // A creates a workspace and a module in it.
  const wsRes = await a("/api/workspaces", {
    method: "POST",
    body: JSON.stringify({ name: "A private workspace", purpose: "testing" })
  });
  assert.equal(wsRes.status, 201);
  const { workspace } = await wsRes.json();

  const modRes = await a(`/api/workspaces/${workspace.id}/modules`, {
    method: "POST",
    body: JSON.stringify({ name: "A private module" })
  });
  assert.equal(modRes.status, 201);
  const { module } = await modRes.json();

  // A sees them.
  const aList = await (await a("/api/workspaces")).json();
  assert.ok(aList.workspaces.some((w) => w.id === workspace.id));

  // B sees nothing of A's, by any route or verb.
  const bList = await (await b("/api/workspaces")).json();
  assert.equal(
    bList.workspaces.some((w) => w.id === workspace.id),
    false,
    "B must not see A's workspace in the list"
  );
  assert.equal((await b(`/api/workspaces/${workspace.id}`)).status, 404);
  assert.equal((await b(`/api/workspaces/${workspace.id}/modules`)).status, 404);
  assert.equal(
    (await b(`/api/modules/${module.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "hijacked" })
    })).status,
    404
  );
  assert.equal((await b(`/api/workspaces/${workspace.id}`, { method: "DELETE" })).status, 404);

  // A's module is untouched.
  const stillThere = await (await a(`/api/workspaces/${workspace.id}/modules`)).json();
  assert.equal(stillThere.modules[0].name, "A private module");
});

test("soft-deleted workspace disappears from the list and can be restored", async () => {
  const a = authed((await signUpJar("wr")).header());
  const { workspace } = await (
    await a("/api/workspaces", { method: "POST", body: JSON.stringify({ name: "Temp" }) })
  ).json();

  assert.equal((await a(`/api/workspaces/${workspace.id}`, { method: "DELETE" })).status, 200);
  let list = await (await a("/api/workspaces")).json();
  assert.equal(list.workspaces.some((w) => w.id === workspace.id), false);

  assert.equal((await a(`/api/workspaces/${workspace.id}/restore`, { method: "POST" })).status, 200);
  list = await (await a("/api/workspaces")).json();
  assert.equal(list.workspaces.some((w) => w.id === workspace.id), true);
});

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

async function makeWorkspace(client, name) {
  const res = await client("/api/workspaces", {
    method: "POST",
    body: JSON.stringify({ name })
  });
  assert.equal(res.status, 201);
  return (await res.json()).workspace;
}

test("notes are private to their owner", async () => {
  const a = authed((await signUpJar("na")).header());
  const b = authed((await signUpJar("nb")).header());
  const ws = await makeWorkspace(a, "A notes workspace");

  const created = await a(`/api/workspaces/${ws.id}/notes`, {
    method: "POST",
    body: JSON.stringify({ title: "Secret", text: "private thoughts" })
  });
  assert.equal(created.status, 201);
  const { note } = await created.json();

  assert.equal((await fetch(`${BASE}/api/notes/${note.id}`)).status, 401);
  assert.equal((await b(`/api/notes/${note.id}`)).status, 404);
  assert.equal(
    (await b(`/api/notes/${note.id}`, { method: "PATCH", body: JSON.stringify({ text: "x" }) }))
      .status,
    404
  );
  assert.equal((await b(`/api/notes/${note.id}`, { method: "DELETE" })).status, 404);
  assert.equal((await b(`/api/notes/${note.id}/versions`)).status, 404);

  const aStill = await (await a(`/api/notes/${note.id}`)).json();
  assert.equal(aStill.note.content_text, "private thoughts");
});

test("note delete moves it to Recently Deleted, and it can be restored", async () => {
  const a = authed((await signUpJar("nd")).header());
  const ws = await makeWorkspace(a, "Delete/restore");
  const { note } = await (
    await a(`/api/workspaces/${ws.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ title: "Throwaway" })
    })
  ).json();

  assert.equal((await a(`/api/notes/${note.id}`, { method: "DELETE" })).status, 200);

  const live = await (await a(`/api/workspaces/${ws.id}/notes`)).json();
  assert.equal(live.notes.some((n) => n.id === note.id), false);

  const trashed = await (await a(`/api/workspaces/${ws.id}/notes?deleted=1`)).json();
  assert.equal(trashed.notes.some((n) => n.id === note.id), true);

  assert.equal((await a(`/api/notes/${note.id}/restore`, { method: "POST" })).status, 200);
  const back = await (await a(`/api/workspaces/${ws.id}/notes`)).json();
  assert.equal(back.notes.some((n) => n.id === note.id), true);
});

test("restoring an older version does not lose later history", async () => {
  const a = authed((await signUpJar("nv")).header());
  const ws = await makeWorkspace(a, "Versions");
  const { note } = await (
    await a(`/api/workspaces/${ws.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ title: "V", text: "one" })
    })
  ).json();

  // Manual saves force a snapshot each time: v1=one, v2=two, v3=three.
  await a(`/api/notes/${note.id}`, {
    method: "PATCH",
    body: JSON.stringify({ text: "two", source: "manual" })
  });
  await a(`/api/notes/${note.id}`, {
    method: "PATCH",
    body: JSON.stringify({ text: "three", source: "manual" })
  });

  let versions = (await (await a(`/api/notes/${note.id}/versions`)).json()).versions;
  assert.deepEqual(
    versions.map((v) => v.version).sort((x, y) => x - y),
    [1, 2, 3]
  );

  // Restore v1 ("one"). Current content becomes "one"; a new v4 is appended.
  const restored = await (
    await a(`/api/notes/${note.id}/versions/1/restore`, { method: "POST" })
  ).json();
  assert.equal(restored.note.content_text, "one");

  versions = (await (await a(`/api/notes/${note.id}/versions`)).json()).versions;
  const nums = versions.map((v) => v.version).sort((x, y) => x - y);
  assert.deepEqual(nums, [1, 2, 3, 4], "v2 and v3 must survive the restore");
  const v2 = versions.find((v) => v.version === 2);
  const v3 = versions.find((v) => v.version === 3);
  assert.equal(v2.content_text, "two");
  assert.equal(v3.content_text, "three");
});

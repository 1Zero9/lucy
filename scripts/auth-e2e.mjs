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
  return (path, init = {}) => {
    // Let fetch set the multipart boundary itself for FormData bodies.
    const isForm = init.body instanceof FormData;
    return fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        ...(isForm ? {} : { "content-type": "application/json" }),
        origin: BASE,
        cookie: cookieHeader,
        ...(init.headers ?? {})
      }
    });
  };
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

test("colour and pin persist and do not create a version", async () => {
  const a = authed((await signUpJar("cp")).header());
  const ws = await makeWorkspace(a, "Colour/pin");
  const { note } = await (
    await a(`/api/workspaces/${ws.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ title: "Styled" })
    })
  ).json();

  const before = (await (await a(`/api/notes/${note.id}/versions`)).json()).versions.length;

  await a(`/api/notes/${note.id}`, {
    method: "PATCH",
    body: JSON.stringify({ colour: "#dcfce7", isPinned: true })
  });

  const got = (await (await a(`/api/notes/${note.id}`)).json()).note;
  assert.equal(got.colour, "#DCFCE7");
  assert.equal(got.is_pinned, 1);

  const after = (await (await a(`/api/notes/${note.id}/versions`)).json()).versions.length;
  assert.equal(after, before, "metadata changes must not add a version");
});

test("folders and tags are workspace-scoped, private, and filter the note list", async () => {
  const a = authed((await signUpJar("ft")).header());
  const b = authed((await signUpJar("fu")).header());
  const ws = await makeWorkspace(a, "Filing");

  const { folder } = await (
    await a(`/api/workspaces/${ws.id}/folders`, {
      method: "POST",
      body: JSON.stringify({ name: "Lectures" })
    })
  ).json();

  const inFolder = (await (
    await a(`/api/workspaces/${ws.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ title: "In folder", folderId: folder.id })
    })
  ).json()).note;
  const loose = (await (
    await a(`/api/workspaces/${ws.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ title: "Loose" })
    })
  ).json()).note;

  // Tag one note; tags are created on the fly.
  const setRes = await a(`/api/notes/${inFolder.id}/tags`, {
    method: "PUT",
    body: JSON.stringify({ tags: ["exam", "week-1"] })
  });
  assert.equal(setRes.status, 200);
  const { tags } = await setRes.json();
  assert.deepEqual(tags.map((t) => t.name).sort(), ["exam", "week-1"]);
  const examTag = tags.find((t) => t.name === "exam");

  // Filter by folder.
  const byFolder = (await (await a(`/api/workspaces/${ws.id}/notes?folder=${folder.id}`)).json())
    .notes;
  assert.deepEqual(byFolder.map((n) => n.id), [inFolder.id]);

  // Filter by "no folder".
  const noFolder = (await (await a(`/api/workspaces/${ws.id}/notes?folder=none`)).json()).notes;
  assert.equal(noFolder.some((n) => n.id === loose.id), true);
  assert.equal(noFolder.some((n) => n.id === inFolder.id), false);

  // Filter by tag.
  const byTag = (await (await a(`/api/workspaces/${ws.id}/notes?tag=${examTag.id}`)).json()).notes;
  assert.deepEqual(byTag.map((n) => n.id), [inFolder.id]);

  // B sees none of A's folders/tags and cannot touch A's folder.
  assert.equal((await b(`/api/workspaces/${ws.id}/folders`)).status, 404);
  assert.equal(
    (await b(`/api/folders/${folder.id}`, { method: "PATCH", body: JSON.stringify({ name: "x" }) }))
      .status,
    404
  );
  assert.equal((await b(`/api/tags/${examTag.id}`, { method: "DELETE" })).status, 404);

  // Deleting a folder detaches its notes (they are not deleted).
  assert.equal((await a(`/api/folders/${folder.id}`, { method: "DELETE" })).status, 200);
  const afterDelete = (await (await a(`/api/notes/${inFolder.id}`)).json()).note;
  assert.equal(afterDelete.folder_id, null);
});

function uploadForm(bytes, filename, type, noteId) {
  const form = new FormData();
  form.set("file", new File([bytes], filename, { type }));
  if (noteId) form.set("noteId", noteId);
  return form;
}

test("files: upload, private download, ownership, soft delete, purge", async () => {
  const a = authed((await signUpJar("fa1")).header());
  const b = authed((await signUpJar("fb1")).header());
  const ws = await makeWorkspace(a, "Files ws");

  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4, 5]); // PNG-ish
  const up = await a(`/api/workspaces/${ws.id}/attachments`, {
    method: "POST",
    body: uploadForm(bytes, "diagram.png", "image/png")
  });
  assert.equal(up.status, 201);
  const { attachment } = await up.json();
  assert.equal(attachment.filename, "diagram.png");
  assert.equal(attachment.content_type, "image/png");
  assert.equal(attachment.size_bytes, bytes.length);

  // Owner download returns the exact bytes and the right headers.
  const dl = await a(`/api/attachments/${attachment.id}/download`);
  assert.equal(dl.status, 200);
  assert.equal(dl.headers.get("content-type"), "image/png");
  assert.match(dl.headers.get("content-disposition") ?? "", /diagram\.png/);
  const got = new Uint8Array(await dl.arrayBuffer());
  assert.deepEqual([...got], [...bytes], "downloaded bytes must match the upload");

  // Anonymous and other-user access is refused.
  assert.equal((await fetch(`${BASE}/api/attachments/${attachment.id}/download`)).status, 401);
  assert.equal((await b(`/api/attachments/${attachment.id}`)).status, 404);
  assert.equal((await b(`/api/attachments/${attachment.id}/download`)).status, 404);
  assert.equal((await b(`/api/attachments/${attachment.id}`, { method: "DELETE" })).status, 404);
  assert.equal((await b(`/api/workspaces/${ws.id}/attachments`)).status, 404);

  // Disallowed type and empty file are rejected.
  assert.equal(
    (await a(`/api/workspaces/${ws.id}/attachments`, {
      method: "POST",
      body: uploadForm(new Uint8Array([1, 2, 3]), "x.exe", "application/x-msdownload")
    })).status,
    415
  );
  assert.equal(
    (await a(`/api/workspaces/${ws.id}/attachments`, {
      method: "POST",
      body: uploadForm(new Uint8Array([]), "empty.png", "image/png")
    })).status,
    400
  );

  // Soft delete -> gone from the live list, present in ?deleted=1, restorable.
  assert.equal((await a(`/api/attachments/${attachment.id}`, { method: "DELETE" })).status, 200);
  let list = await (await a(`/api/workspaces/${ws.id}/attachments`)).json();
  assert.equal(list.attachments.some((x) => x.id === attachment.id), false);
  let trash = await (await a(`/api/workspaces/${ws.id}/attachments?deleted=1`)).json();
  assert.equal(trash.attachments.some((x) => x.id === attachment.id), true);
  assert.equal((await a(`/api/attachments/${attachment.id}/restore`, { method: "POST" })).status, 200);

  // Purge removes the row and the object (download 404 afterwards).
  await a(`/api/attachments/${attachment.id}`, { method: "DELETE" });
  assert.equal((await a(`/api/attachments/${attachment.id}/purge`, { method: "POST" })).status, 200);
  assert.equal((await a(`/api/attachments/${attachment.id}`)).status, 404);
  assert.equal((await a(`/api/attachments/${attachment.id}/download`)).status, 404);
});

test("files: a note-scoped upload is listed under that note only", async () => {
  const a = authed((await signUpJar("fa2")).header());
  const ws = await makeWorkspace(a, "Note files");
  const { note } = await (
    await a(`/api/workspaces/${ws.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ title: "Has files" })
    })
  ).json();

  const up = await a(`/api/workspaces/${ws.id}/attachments`, {
    method: "POST",
    body: uploadForm(new TextEncoder().encode("hello"), "notes.txt", "text/plain", note.id)
  });
  assert.equal(up.status, 201);
  const { attachment } = await up.json();
  assert.equal(attachment.note_id, note.id);

  const scoped = await (await a(`/api/workspaces/${ws.id}/attachments?noteId=${note.id}`)).json();
  assert.deepEqual(scoped.attachments.map((x) => x.id), [attachment.id]);

  // A note-id from another workspace is rejected.
  const other = await makeWorkspace(a, "Elsewhere");
  const bad = await a(`/api/workspaces/${other.id}/attachments`, {
    method: "POST",
    body: uploadForm(new TextEncoder().encode("x"), "x.txt", "text/plain", note.id)
  });
  assert.equal(bad.status, 400);
});

test("tasks: create, status, due filter, isolation, soft delete", async () => {
  const a = authed((await signUpJar("ta")).header());
  const b = authed((await signUpJar("tb")).header());
  const ws = await makeWorkspace(a, "Tasks ws");

  assert.equal((await fetch(`${BASE}/api/workspaces/${ws.id}/tasks`)).status, 401);

  const created = await a(`/api/workspaces/${ws.id}/tasks`, {
    method: "POST",
    body: JSON.stringify({ title: "Read chapter 3", dueAt: "2026-10-01" })
  });
  assert.equal(created.status, 201);
  const { task } = await created.json();
  assert.equal(task.status, "open");
  assert.ok(task.due_at, "due_at should be stored");

  // Status transitions.
  const doneRes = await a(`/api/tasks/${task.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "done" })
  });
  assert.equal(doneRes.status, 200);
  assert.equal((await doneRes.json()).task.completed_at !== null, true);

  const openList = (await (await a(`/api/workspaces/${ws.id}/tasks?status=open`)).json()).tasks;
  const doneList = (await (await a(`/api/workspaces/${ws.id}/tasks?status=done`)).json()).tasks;
  assert.equal(openList.some((t) => t.id === task.id), false);
  assert.equal(doneList.some((t) => t.id === task.id), true);

  // Clear the due date.
  const cleared = await (
    await a(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ dueAt: null }) })
  ).json();
  assert.equal(cleared.task.due_at, null);

  // A note id from another workspace is rejected.
  const other = await makeWorkspace(a, "Other ws");
  const otherNote = (await (
    await a(`/api/workspaces/${other.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ title: "n" })
    })
  ).json()).note;
  assert.equal(
    (await a(`/api/workspaces/${ws.id}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title: "x", noteId: otherNote.id })
    })).status,
    400
  );

  // Isolation.
  assert.equal((await b(`/api/tasks/${task.id}`)).status, 404);
  assert.equal(
    (await b(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ title: "hi" }) }))
      .status,
    404
  );
  assert.equal((await b(`/api/tasks/${task.id}`, { method: "DELETE" })).status, 404);
  assert.equal((await b(`/api/workspaces/${ws.id}/tasks`)).status, 404);

  // Soft delete + restore.
  assert.equal((await a(`/api/tasks/${task.id}`, { method: "DELETE" })).status, 200);
  assert.equal(
    (await (await a(`/api/workspaces/${ws.id}/tasks?deleted=1`)).json()).tasks.some(
      (t) => t.id === task.id
    ),
    true
  );
  assert.equal((await a(`/api/tasks/${task.id}/restore`, { method: "POST" })).status, 200);
});

test("stickies: create, edit, isolation, soft delete", async () => {
  const a = authed((await signUpJar("sa")).header());
  const b = authed((await signUpJar("sb")).header());
  const ws = await makeWorkspace(a, "Stickies ws");

  const created = await a(`/api/workspaces/${ws.id}/stickies`, {
    method: "POST",
    body: JSON.stringify({ body: "call the tutor" })
  });
  assert.equal(created.status, 201);
  const { sticky } = await created.json();

  const edited = await (
    await a(`/api/stickies/${sticky.id}`, {
      method: "PATCH",
      body: JSON.stringify({ body: "call the tutor tomorrow", colour: "#dcfce7" })
    })
  ).json();
  assert.equal(edited.sticky.body, "call the tutor tomorrow");
  assert.equal(edited.sticky.colour, "#DCFCE7");

  assert.equal((await b(`/api/stickies/${sticky.id}`, { method: "PATCH", body: JSON.stringify({ body: "x" }) })).status, 404);
  assert.equal((await b(`/api/workspaces/${ws.id}/stickies`)).status, 404);

  assert.equal((await a(`/api/stickies/${sticky.id}`, { method: "DELETE" })).status, 200);
  assert.equal(
    (await (await a(`/api/workspaces/${ws.id}/stickies`)).json()).stickies.length,
    0
  );
  assert.equal((await a(`/api/stickies/${sticky.id}/restore`, { method: "POST" })).status, 200);
});

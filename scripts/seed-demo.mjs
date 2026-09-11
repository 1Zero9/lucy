// Populates a demo account with realistic-looking data so LUCY can be shown
// off without using a real user's workspace. Dev-only by design — refuses to
// run against anything that looks like the production domain.
//
// Usage:
//   npm run seed:demo
//   BASE_URL=http://localhost:3001 npm run seed:demo   (local dev)
//
// Idempotent: if the demo workspace already exists, it reports the account
// and exits without creating duplicates.

import zlib from "node:zlib";

const BASE = process.env.BASE_URL ?? "https://lucy-dev.1zero9.com";
const EMAIL = process.env.DEMO_EMAIL ?? "demo@1zero9.com";
const PASSWORD = process.env.DEMO_PASSWORD ?? "LucyDemo2026!";

// Refuse anything that looks like production unless explicitly overridden.
const looksProd = /(^|\/\/)lucy\.(1zero9\.com|onezeronine\.workers\.dev)/.test(BASE);
if (looksProd && process.env.ALLOW_PROD_SEED !== "yes") {
  console.error(`Refusing to seed demo data into what looks like production (${BASE}).`);
  console.error("Set ALLOW_PROD_SEED=yes if you really mean it (you don't).");
  process.exit(1);
}

function jar() {
  const cookies = new Map();
  return {
    absorb(res) {
      for (const c of res.headers.getSetCookie?.() ?? []) {
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

let cookieHeader = "";

async function api(path, init = {}) {
  const isForm = init.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(isForm ? {} : { "content-type": "application/json" }),
      origin: BASE,
      cookie: cookieHeader,
      ...(init.headers ?? {})
    }
  });
  const j = jar();
  j.absorb(res);
  const extra = j.header();
  if (extra) cookieHeader = cookieHeader ? `${cookieHeader}; ${extra}` : extra;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status}: ${body.error ?? JSON.stringify(body)}`);
  return body;
}

async function signInOrUp() {
  const up = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ name: "Demo", email: EMAIL, password: PASSWORD })
  });
  const j = jar();
  j.absorb(up);
  if (up.ok) {
    cookieHeader = j.header();
    console.log(`Created demo account: ${EMAIL}`);
    return;
  }
  const inRes = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  if (!inRes.ok) {
    throw new Error(`Could not sign up or sign in as ${EMAIL}: ${await inRes.text()}`);
  }
  const j2 = jar();
  j2.absorb(inRes);
  cookieHeader = j2.header();
  console.log(`Signed in to existing demo account: ${EMAIL}`);
}

/** A tiny valid PNG (solid background + one accent rectangle) — no deps. */
function makePng(width, height, bg, accent) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0; // filter: none
    const inAccent = y > height * 0.55 && y < height * 0.75;
    for (let x = 0; x < width; x++) {
      const useAccent = inAccent && x > width * 0.1 && x < width * 0.6;
      const [r, g, b] = useAccent ? accent : bg;
      const off = rowStart + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }
  const idatData = zlib.deflateSync(raw);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, data])) >>> 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idatData), chunk("IEND", Buffer.alloc(0))]);
}

async function main() {
  console.log(`Seeding demo data into ${BASE}`);
  await signInOrUp();

  const { workspaces } = await api("/api/workspaces");
  const existing = workspaces.find((w) => w.name === "CISSP Certification");
  if (existing) {
    console.log("\nDemo data already present — not creating duplicates.");
    console.log(`Log in at ${BASE}/login`);
    console.log(`  email:    ${EMAIL}`);
    console.log(`  password: ${PASSWORD}`);
    return;
  }

  // --- secondary workspace first, so the richer one below ends up "newest"
  // and is what a fresh login lands on by default (resolveActiveWorkspace
  // falls back to the most recently created workspace). --------------------
  const { workspace: ws2 } = await api("/api/workspaces", {
    method: "POST",
    body: JSON.stringify({ name: "French B2", purpose: "Evening class", colour: "#DBEAFE" })
  });
  const { module: ws2Module } = await api(`/api/workspaces/${ws2.id}/modules`, {
    method: "POST",
    body: JSON.stringify({ name: "Subjonctif" })
  });
  await api(`/api/workspaces/${ws2.id}/notes`, {
    method: "POST",
    body: JSON.stringify({
      title: "Subjunctive trigger phrases",
      moduleId: ws2Module.id,
      text: "il faut que, je veux que, bien que, avant que — all followed by the subjunctive."
    })
  });
  console.log(`Created second workspace: ${ws2.name}`);

  // --- primary workspace -----------------------------------------------
  const { workspace } = await api("/api/workspaces", {
    method: "POST",
    body: JSON.stringify({
      name: "CISSP Certification",
      purpose: "Professional certification study",
      colour: "#EDE9FE"
    })
  });
  console.log(`Created workspace: ${workspace.name}`);

  const moduleNames = [
    { name: "Domain 1: Security & Risk Management", code: "D1" },
    { name: "Domain 3: Security Architecture & Engineering", code: "D3" },
    { name: "Domain 7: Security Operations", code: "D7" }
  ];
  const modules = {};
  for (const m of moduleNames) {
    const { module } = await api(`/api/workspaces/${workspace.id}/modules`, {
      method: "POST",
      body: JSON.stringify(m)
    });
    modules[m.code] = module;
  }
  console.log(`Created ${moduleNames.length} modules`);

  const { folder: revisionFolder } = await api(`/api/workspaces/${workspace.id}/folders`, {
    method: "POST",
    body: JSON.stringify({ name: "Revision" })
  });
  await api(`/api/workspaces/${workspace.id}/folders`, {
    method: "POST",
    body: JSON.stringify({ name: "Week 1" })
  });

  const notes = [
    {
      title: "CIA Triad",
      moduleId: modules.D1.id,
      folderId: revisionFolder.id,
      pin: true,
      tags: ["exam", "definitions"],
      text: `## Confidentiality, Integrity, Availability

The three pillars security controls are measured against.

- **Confidentiality** — only authorised parties can read the data
- **Integrity** — data hasn't been altered without authorisation
- **Availability** — data and systems are usable when needed

> Exam tip: most scenario questions map straight back to one of these three.`
    },
    {
      title: "Risk treatment options",
      moduleId: modules.D1.id,
      tags: ["definitions"],
      text: `Four ways to handle an identified risk:

1. Avoid — stop doing the risky thing
2. Transfer — insurance, outsourcing
3. Mitigate — reduce likelihood or impact
4. Accept — proceed, document the decision

Residual risk is whatever's left after treatment.`
    },
    {
      title: "Defense in depth notes",
      moduleId: modules.D3.id,
      text: `Layered controls so no single failure is catastrophic.

- [ ] Re-read the Bell-LaPadula vs Biba comparison
- [ ] Diagram a layered network (see Drawings)
- [x] Watch the domain 3 lecture recording`
    },
    {
      title: "Incident response phases",
      moduleId: modules.D7.id,
      tags: ["exam"],
      text: `Preparation → Detection & Analysis → Containment → Eradication → Recovery → Lessons Learned.

Keep a chain of custody for anything that might end up as evidence.`
    },
    {
      title: "Random things to check",
      text: "No module yet — things I want to fold into proper notes later."
    }
  ];
  let firstNoteId = null;
  for (const n of notes) {
    const { note } = await api(`/api/workspaces/${workspace.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ title: n.title, text: n.text, moduleId: n.moduleId, folderId: n.folderId })
    });
    firstNoteId ??= note.id;
    if (n.pin) await api(`/api/notes/${note.id}`, { method: "PATCH", body: JSON.stringify({ isPinned: true }) });
    if (n.tags) await api(`/api/notes/${note.id}/tags`, { method: "PUT", body: JSON.stringify({ tags: n.tags }) });
  }
  console.log(`Created ${notes.length} notes`);

  const now = Date.now();
  const iso = (days) => new Date(now + days * 86400000).toISOString();
  const tasks = [
    { title: "Submit CPE hours", dueAt: iso(-2) },
    { title: "Finish Domain 3 practice questions", dueAt: iso(0), moduleId: modules.D3.id },
    { title: "Book exam slot", dueAt: iso(3) },
    { title: "Review incident response flashcards", dueAt: iso(4), moduleId: modules.D7.id },
    { title: "Read chapter 1", dueAt: iso(-10), done: true }
  ];
  for (const t of tasks) {
    const { task } = await api(`/api/workspaces/${workspace.id}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title: t.title, dueAt: t.dueAt, moduleId: t.moduleId })
    });
    if (t.done) await api(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status: "done" }) });
  }
  console.log(`Created ${tasks.length} tasks`);

  const stickies = ["Ask about the retake policy", "Domain 5 exam weight = 13%", "Print the formula sheet"];
  for (const body of stickies) {
    await api(`/api/workspaces/${workspace.id}/stickies`, { method: "POST", body: JSON.stringify({ body }) });
  }
  console.log(`Created ${stickies.length} stickies`);

  const research = [
    {
      title: "(ISC)² Official Study App",
      url: "https://www.isc2.org/",
      annotation: "Official practice questions — do a 20-question set daily."
    },
    {
      title: "NIST SP 800-53",
      url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
      annotation: "Reference for the full security-control catalogue used in Domain 1."
    }
  ];
  for (const r of research) {
    await api(`/api/workspaces/${workspace.id}/research`, { method: "POST", body: JSON.stringify(r) });
  }
  console.log(`Created ${research.length} research items`);

  const cards = [
    { front: "What does the 'A' in CIA triad stand for?", back: "Availability" },
    { front: "Define residual risk", back: "The risk remaining after controls are applied." },
    { front: "Name the six IR phases", back: "Preparation, Detection & Analysis, Containment, Eradication, Recovery, Lessons Learned" },
    { front: "Bell-LaPadula enforces...", back: "Confidentiality (\"no read up, no write down\")" },
    { front: "Biba enforces...", back: "Integrity (\"no write up, no read down\")" }
  ];
  const createdCards = [];
  for (const c of cards) {
    const { card } = await api(`/api/workspaces/${workspace.id}/flashcards`, {
      method: "POST",
      body: JSON.stringify({ ...c, moduleId: modules.D1.id })
    });
    createdCards.push(card);
  }
  // Review a couple so the deck shows varied SRS state, not all "new".
  await api(`/api/flashcards/${createdCards[0].id}/review`, { method: "POST", body: JSON.stringify({ grade: "good" }) });
  await api(`/api/flashcards/${createdCards[1].id}/review`, { method: "POST", body: JSON.stringify({ grade: "easy" }) });
  await api(`/api/flashcards/${createdCards[2].id}/review`, { method: "POST", body: JSON.stringify({ grade: "again" }) });
  console.log(`Created ${cards.length} flashcards (3 reviewed)`);

  const fileForm = new FormData();
  fileForm.set(
    "file",
    new File(
      ["Domain 1 lecture notes\n\n- Governance frameworks\n- Legal & regulatory\n- Professional ethics\n"],
      "domain-1-lecture-notes.txt",
      { type: "text/plain" }
    )
  );
  fileForm.set("noteId", firstNoteId);
  await api(`/api/workspaces/${workspace.id}/attachments`, { method: "POST", body: fileForm });
  console.log("Uploaded 1 file");

  const drawingPng = makePng(640, 400, [255, 255, 255], [124, 58, 237]);
  const drawForm = new FormData();
  drawForm.set("file", new File([drawingPng], "diagram.png", { type: "image/png" }));
  drawForm.set("width", "640");
  drawForm.set("height", "400");
  drawForm.set("title", "Layered network sketch");
  await api(`/api/workspaces/${workspace.id}/drawings`, { method: "POST", body: drawForm });
  console.log("Created 1 drawing");

  console.log(`\nDone. Log in at ${BASE}/login`);
  console.log(`  email:    ${EMAIL}`);
  console.log(`  password: ${PASSWORD}`);
}

main().catch((err) => {
  console.error("\nSeeding failed:", err.message);
  process.exit(1);
});

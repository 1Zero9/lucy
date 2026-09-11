import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listModules } from "@/lib/db/modules";
import { listNotes } from "@/lib/db/notes";
import { listTasks } from "@/lib/db/tasks";
import { listStickies } from "@/lib/db/stickies";
import { listAttachments } from "@/lib/db/attachments";
import { dueBucket } from "@/lib/due";
import { AppShell } from "@/components/app-shell";
import { SignOutButton } from "@/components/sign-out-button";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { ModuleGrid } from "@/components/module-grid";
import { NewNoteButton } from "@/components/new-note-button";

export default async function Page() {
  const user = await requireUser();
  const { active, all } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const db = getDb();
  const [modules, notes, openTasks, stickies, files] = await Promise.all([
    listModules(db, user.id, active.id),
    listNotes(db, user.id, active.id),
    listTasks(db, user.id, active.id, { status: "open" }),
    listStickies(db, user.id, active.id),
    listAttachments(db, user.id, active.id)
  ]);

  const recentNotes = notes.slice(0, 5);
  const today = openTasks.filter((t) => ["overdue", "today"].includes(dueBucket(t.due_at)));
  const comingUp = openTasks.filter((t) => dueBucket(t.due_at) === "soon");
  const recentStickies = stickies.slice(0, 4);
  const recentFiles = files.slice(0, 4);

  return (
    <AppShell active="home" workspaceId={active.id}>
      <div className="topbar">
        <WorkspaceSwitcher workspaces={all} activeId={active.id} />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="who">{user.email}</span>
          <SignOutButton />
        </div>
      </div>

      <section className="hero">
        <h1>{active.name}</h1>
        <p>{active.purpose ?? "Capture. Organise. Learn. Succeed."}</p>
      </section>

      <form action="/search">
        <input
          className="search"
          name="q"
          aria-label="Search"
          placeholder="Search anything in this workspace…"
        />
      </form>

      <div className="home-cols">
        <div>
          <div className="section-head">
            <h2>Today</h2>
            <Link className="linkish" href="/tasks">
              All tasks
            </Link>
          </div>
          {today.length === 0 ? (
            <div className="empty">Nothing due.</div>
          ) : (
            <ul className="mini-list">
              {today.map((t) => (
                <li key={t.id} className={dueBucket(t.due_at) === "overdue" ? "overdue" : undefined}>
                  {t.title}
                </li>
              ))}
            </ul>
          )}

          <div className="section-head" style={{ marginTop: 22 }}>
            <h2>Coming up</h2>
          </div>
          {comingUp.length === 0 ? (
            <div className="empty">Clear for the next week.</div>
          ) : (
            <ul className="mini-list">
              {comingUp.map((t) => (
                <li key={t.id}>
                  {t.title}
                  <span className="muted">
                    {" "}
                    · {new Date(t.due_at as string).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="section-head">
            <h2>Stickies</h2>
            <Link className="linkish" href="/stickies">
              Open board
            </Link>
          </div>
          {recentStickies.length === 0 ? (
            <div className="empty">No stickies.</div>
          ) : (
            <div className="sticky-grid mini">
              {recentStickies.map((s) => (
                <article className="sticky" key={s.id} style={{ background: s.colour ?? "#FEF9C3" }}>
                  <p>{s.body}</p>
                </article>
              ))}
            </div>
          )}

          <div className="section-head" style={{ marginTop: 22 }}>
            <h2>Recent files</h2>
            <Link className="linkish" href="/files">
              All files
            </Link>
          </div>
          {recentFiles.length === 0 ? (
            <div className="empty">No files.</div>
          ) : (
            <ul className="mini-list">
              {recentFiles.map((f) => (
                <li key={f.id}>
                  <a href={`/api/attachments/${f.id}/download`} target="_blank" rel="noreferrer">
                    {f.filename}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 28 }}>
        <h2>Continue</h2>
        <span className="row" style={{ alignItems: "center" }}>
          <Link className="linkish" href="/notes">
            All notes
          </Link>
          <NewNoteButton workspaceId={active.id} />
        </span>
      </div>
      {recentNotes.length === 0 ? (
        <div className="empty">No notes yet.</div>
      ) : (
        <ul className="note-list">
          {recentNotes.map((n) => (
            <li key={n.id}>
              <Link href={`/notes/${n.id}`}>
                <span className="note-list-title">{n.title}</span>
                <span className="muted note-list-meta">
                  Updated {new Date(n.updated_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="section-head" style={{ marginTop: 28 }}>
        <h2>Modules</h2>
        <Link className="linkish" href="/modules">
          Manage modules
        </Link>
      </div>
      <ModuleGrid modules={modules} />
    </AppShell>
  );
}

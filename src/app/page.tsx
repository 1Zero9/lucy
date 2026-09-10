import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listModules } from "@/lib/db/modules";
import { listNotes } from "@/lib/db/notes";
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
  const [modules, notes] = await Promise.all([
    listModules(db, user.id, active.id),
    listNotes(db, user.id, active.id)
  ]);
  const recentNotes = notes.slice(0, 5);

  return (
    <AppShell active="home">
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

      <input className="search" aria-label="Search" placeholder="Search anything…" disabled />

      <div className="section-head">
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

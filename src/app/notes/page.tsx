import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listNotes } from "@/lib/db/notes";
import { AppShell } from "@/components/app-shell";
import { NewNoteButton } from "@/components/new-note-button";

export const metadata = { title: "Notes · LUCY" };

function snippet(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 140 ? `${clean.slice(0, 140)}…` : clean;
}

export default async function NotesPage() {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const notes = await listNotes(getDb(), user.id, active.id);

  return (
    <AppShell active="notes">
      <div className="topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Notes</h1>
          <span className="muted" style={{ fontSize: 14 }}>
            in {active.name}
          </span>
        </div>
        <div className="row" style={{ alignItems: "center" }}>
          <Link className="linkish" href="/notes/trash">
            Recently Deleted
          </Link>
          <NewNoteButton workspaceId={active.id} />
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="empty">No notes yet. Create your first one.</div>
      ) : (
        <ul className="note-list">
          {notes.map((n) => (
            <li key={n.id}>
              <Link href={`/notes/${n.id}`}>
                <span className="note-list-title">{n.title}</span>
                <span className="muted note-list-snippet">
                  {snippet(n.content_text) || "Empty note"}
                </span>
                <span className="muted note-list-meta">
                  Updated {new Date(n.updated_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listNotes, type NoteListOpts } from "@/lib/db/notes";
import { listFolders } from "@/lib/db/folders";
import { listTags, tagsForNotes } from "@/lib/db/tags";
import { AppShell } from "@/components/app-shell";
import { NewNoteButton } from "@/components/new-note-button";
import { NotesFilter } from "@/components/notes-filter";

export const metadata = { title: "Notes · LUCY" };

function snippet(text: string): string {
  const clean = text.replace(/[#*_`>\-]/g, "").replace(/\s+/g, " ").trim();
  return clean.length > 140 ? `${clean.slice(0, 140)}…` : clean;
}

export default async function NotesPage({
  searchParams
}: {
  searchParams: Promise<{ folder?: string; tag?: string }>;
}) {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const db = getDb();
  const sp = await searchParams;
  const opts: NoteListOpts = {};
  if (sp.folder === "none") opts.folderId = null;
  else if (sp.folder) opts.folderId = sp.folder;
  if (sp.tag) opts.tagId = sp.tag;

  const [notes, folders, tags] = await Promise.all([
    listNotes(db, user.id, active.id, opts),
    listFolders(db, user.id, active.id),
    listTags(db, user.id, active.id)
  ]);
  const noteTags = await tagsForNotes(
    db,
    user.id,
    notes.map((n) => n.id)
  );

  return (
    <AppShell active="notes">
      <div className="topbar">
        <div>
          <h1 className="page-title">Notes</h1>
          <span className="muted" style={{ fontSize: 14 }}>
            in {active.name}
          </span>
        </div>
        <div className="row" style={{ alignItems: "center" }}>
          <Link className="linkish" href="/notes/trash">
            Recently Deleted
          </Link>
          <NewNoteButton
            workspaceId={active.id}
            moduleId={undefined}
          />
        </div>
      </div>

      <NotesFilter
        workspaceId={active.id}
        folders={folders}
        tags={tags}
        activeFolder={sp.folder ?? null}
        activeTag={sp.tag ?? null}
      />

      {notes.length === 0 ? (
        <div className="empty">Nothing here. Create a note or clear the filters.</div>
      ) : (
        <ul className="note-list">
          {notes.map((n) => (
            <li key={n.id}>
              <Link href={`/notes/${n.id}`} style={n.colour ? { borderLeft: `6px solid ${n.colour}` } : undefined}>
                <span className="note-list-title">
                  {n.is_pinned === 1 ? "★ " : ""}
                  {n.title}
                </span>
                <span className="muted note-list-snippet">
                  {snippet(n.content_text) || "Empty note"}
                </span>
                <span className="note-list-meta muted">
                  Updated {new Date(n.updated_at).toLocaleDateString()}
                  {(noteTags.get(n.id) ?? []).map((t) => (
                    <span className="chip sm" key={t.id}>
                      {t.name}
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

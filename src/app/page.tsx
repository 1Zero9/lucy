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
import { relativeDate } from "@/lib/format-date";
import { AppShell } from "@/components/app-shell";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { NewNoteButton } from "@/components/new-note-button";
import { EmptyState } from "@/components/empty-state";
import { NotesIcon, TasksIcon } from "@/components/icons";
import { SearchShortcut } from "@/components/search-shortcut";

// Strip raw Markdown markers so the Home preview reads as text, not source
// (UPGRADE.md §5: "Home currently exposes Markdown markers such as ## and **").
function snippet(text: string, max = 140): string {
  const flat = text
    .trim()
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>#-]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ");
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}

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

  const dueNow = openTasks.filter((t) => ["overdue", "today"].includes(dueBucket(t.due_at)));
  const upcoming = openTasks
    .filter((t) => t.due_at && ["soon", "later"].includes(dueBucket(t.due_at)))
    .sort((a, b) => (a.due_at as string).localeCompare(b.due_at as string));
  const nextDeadline = upcoming[0] ?? null;
  const moduleById = new Map(modules.map((module) => [module.id, module]));
  const recentNotes = notes.slice(0, 6);

  return (
    <AppShell active="home" workspaceId={active.id}>
      <SearchShortcut />
      <header className="home-header">
        <div>
          <span className="home-eyebrow">Workspace</span>
          <h1 className="home-title">{active.name}</h1>
          {active.purpose ? <p className="home-subtitle">{active.purpose}</p> : null}
        </div>
        <div className="home-header-actions">
          <WorkspaceSwitcher workspaces={all} activeId={active.id} />
          <NewNoteButton workspaceId={active.id} />
        </div>
      </header>

      <form action="/search" className="home-search">
        <input
          className="search"
          name="q"
          aria-label="Search"
          placeholder="Search notes, tasks and files…"
        />
        <span className="search-kbd" aria-hidden="true">
          ⌘K
        </span>
      </form>

      <div className="home-layout">
        <section className="home-primary" aria-labelledby="continue-heading">
          <div className="section-head">
            <h2 id="continue-heading">
              <NotesIcon size={18} /> Continue where you left off
            </h2>
            <Link className="linkish" href="/notes">
              All notes
            </Link>
          </div>
          {recentNotes.length === 0 ? (
            <EmptyState
              title="No notes yet"
              body="Start writing — LUCY saves as you go."
              action={<NewNoteButton workspaceId={active.id} label="Create your first note" />}
            />
          ) : (
            <div className="continue-grid">
              {recentNotes.map((note) => {
                const module = note.module_id ? moduleById.get(note.module_id) : undefined;
                return (
                  <Link href={`/notes/${note.id}`} className="note-tile" key={note.id}>
                    <div className="note-tile-top">
                      {module ? (
                        <span
                          className="note-module"
                          style={{ "--module-colour": module.colour } as React.CSSProperties}
                        >
                          {module.name}
                        </span>
                      ) : (
                        <span className="note-module is-unfiled">Unfiled</span>
                      )}
                      {note.is_pinned === 1 ? <span className="note-pinned">Pinned</span> : null}
                    </div>
                    <span className="note-tile-title">{note.title}</span>
                    <span className="note-tile-preview">
                      {snippet(note.content_text) || "Open this note to start writing."}
                    </span>
                    <span className="note-tile-time">Edited {relativeDate(note.updated_at)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <aside className="home-sidebar" aria-label="Workspace overview">
          <section className="home-panel">
            <div className="section-head">
              <h2>
                <TasksIcon size={18} /> Today
              </h2>
              <Link className="linkish" href="/tasks">
                Tasks
              </Link>
            </div>
            {dueNow.length === 0 ? (
              <p className="home-panel-empty">Nothing due today.</p>
            ) : (
              <ul className="home-task-list">
                {dueNow.slice(0, 4).map((task) => (
                  <li key={task.id} className={dueBucket(task.due_at) === "overdue" ? "is-overdue" : undefined}>
                    {task.title}
                  </li>
                ))}
              </ul>
            )}
            {nextDeadline ? (
              <div className="next-deadline">
                <span>Next up</span>
                <strong>{nextDeadline.title}</strong>
                <small>{relativeDate(nextDeadline.due_at as string)}</small>
              </div>
            ) : null}
          </section>

          <section className="home-panel workspace-panel">
            <div className="section-head">
              <h2>Workspace</h2>
              <Link className="linkish" href="/modules">
                Manage
              </Link>
            </div>
            <div className="workspace-stats">
              <Link href="/modules">
                <strong>{modules.length}</strong>
                <span>Subjects</span>
              </Link>
              <Link href="/files">
                <strong>{files.length}</strong>
                <span>Files</span>
              </Link>
              <Link href="/stickies">
                <strong>{stickies.length}</strong>
                <span>Stickies</span>
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

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
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { NewNoteButton } from "@/components/new-note-button";
import { EmptyState } from "@/components/empty-state";
import { FilesIcon, ModulesIcon, NotesIcon, StickyIcon, TasksIcon } from "@/components/icons";

function snippet(text: string, max = 140): string {
  const flat = text.trim().replace(/\s+/g, " ");
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

  const [featuredNote, ...restNotes] = notes;
  const continueNotes = restNotes.slice(0, 3);

  const dueNow = openTasks.filter((t) => ["overdue", "today"].includes(dueBucket(t.due_at)));
  const upcoming = openTasks
    .filter((t) => t.due_at && ["soon", "later"].includes(dueBucket(t.due_at)))
    .sort((a, b) => (a.due_at as string).localeCompare(b.due_at as string));
  const nextDeadline = upcoming[0] ?? null;

  return (
    <AppShell active="home" workspaceId={active.id}>
      <div className="topbar">
        <div>
          <h1 className="page-title">{active.name}</h1>
          <WorkspaceSwitcher workspaces={all} activeId={active.id} />
        </div>
        <NewNoteButton workspaceId={active.id} />
      </div>

      <form action="/search">
        <input
          className="search"
          name="q"
          aria-label="Search"
          placeholder="Search anything in this workspace…"
        />
      </form>

      <div className="section-head">
        <h2>
          <NotesIcon size={16} /> Continue
        </h2>
        <Link className="linkish" href="/notes">
          View all
        </Link>
      </div>
      {!featuredNote ? (
        <EmptyState
          title="No notes yet"
          body="Start writing — LUCY saves as you go."
          action={<NewNoteButton workspaceId={active.id} label="New note" />}
        />
      ) : (
        <>
          <Link href={`/notes/${featuredNote.id}`} className="continue-featured">
            <span className="note-list-title">{featuredNote.title}</span>
            {featuredNote.content_text ? (
              <span className="note-list-snippet muted">{snippet(featuredNote.content_text)}</span>
            ) : null}
            <span className="muted note-list-meta">
              Updated {new Date(featuredNote.updated_at).toLocaleDateString()}
            </span>
          </Link>
          {continueNotes.length > 0 ? (
            <ul className="note-list continue-compact">
              {continueNotes.map((n) => (
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
          ) : null}
        </>
      )}

      <div className="section-head" style={{ marginTop: 28 }}>
        <h2>
          <TasksIcon size={16} /> Today
        </h2>
        <Link className="linkish" href="/tasks">
          View all
        </Link>
      </div>
      <div className="today-card">
        <div className="today-tasks">
          {dueNow.length === 0 ? (
            <div className="empty">Nothing due.</div>
          ) : (
            <ul className="mini-list">
              {dueNow.map((t) => (
                <li key={t.id} className={dueBucket(t.due_at) === "overdue" ? "overdue" : undefined}>
                  {t.title}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="today-next">
          {nextDeadline ? (
            <>
              <span className="k">Next deadline</span>
              <span>{nextDeadline.title}</span>
              <span className="muted">{new Date(nextDeadline.due_at as string).toLocaleDateString()}</span>
            </>
          ) : (
            <span className="muted">Nothing else on the horizon.</span>
          )}
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 28 }}>
        <h2>Workspace</h2>
      </div>
      <div className="workspace-links">
        <Link href="/stickies" className="workspace-link">
          <StickyIcon size={20} />
          <span>Stickies</span>
          <span className="count">{stickies.length}</span>
        </Link>
        <Link href="/files" className="workspace-link">
          <FilesIcon size={20} />
          <span>Files</span>
          <span className="count">{files.length}</span>
        </Link>
        <Link href="/modules" className="workspace-link">
          <ModulesIcon size={20} />
          <span>Modules</span>
          <span className="count">{modules.length}</span>
        </Link>
      </div>
    </AppShell>
  );
}

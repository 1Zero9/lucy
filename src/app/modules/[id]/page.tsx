import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getModule } from "@/lib/db/modules";
import { listNotes } from "@/lib/db/notes";
import { listFlashcards } from "@/lib/db/flashcards";
import { listModules } from "@/lib/db/modules";
import { relativeDate } from "@/lib/format-date";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { NewNoteButton } from "@/components/new-note-button";
import { ModuleHeaderActions } from "@/components/module-header-actions";
import { FlashcardsManager } from "@/components/flashcards-manager";
import { NotesIcon, FlashcardsIcon } from "@/components/icons";

export const metadata = { title: "Subject · LUCY" };

/**
 * A subject/module's own page — UPGRADE.md §1: "Modules cards look like
 * destinations, but only offer Rename and Delete. Selecting a subject
 * should open its notes, with Files and Flashcards alongside them.
 * Creating an item there should automatically assign it to that subject."
 * Files-by-subject is out of scope here (attachments aren't module-scoped
 * in the schema) — tracked separately in BUILD_PLAN.md Phase 8.
 */
export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = getDb();

  const mod = await getModule(db, user.id, id);
  if (!mod) notFound();

  const [notes, cards, allModules, allNotes] = await Promise.all([
    listNotes(db, user.id, mod.workspace_id, { moduleId: mod.id }),
    listFlashcards(db, user.id, mod.workspace_id, { moduleId: mod.id }),
    listModules(db, user.id, mod.workspace_id),
    listNotes(db, user.id, mod.workspace_id)
  ]);

  return (
    <AppShell active="modules" workspaceId={mod.workspace_id}>
      <p style={{ marginTop: 0 }}>
        <Link className="linkish" href="/modules">
          ← Modules
        </Link>
      </p>

      <div className="topbar">
        <div>
          <h1 className="page-title">{mod.name}</h1>
          {mod.description ? <p className="muted" style={{ marginTop: 4 }}>{mod.description}</p> : null}
        </div>
        <ModuleHeaderActions module={mod} />
      </div>

      <div className="section-head">
        <h2>
          <NotesIcon size={16} /> Notes
        </h2>
        <NewNoteButton workspaceId={mod.workspace_id} moduleId={mod.id} label="New note" />
      </div>
      {notes.length === 0 ? (
        <EmptyState
          icon={<NotesIcon size={22} />}
          title="No notes in this subject yet"
          body="Notes you create here are assigned to it automatically."
        />
      ) : (
        <ul className="note-list" style={{ marginBottom: 28 }}>
          {notes.map((n) => (
            <li key={n.id}>
              <Link href={`/notes/${n.id}`}>
                <span className="note-list-title">{n.title}</span>
                <span className="muted note-list-meta">
                  Updated {relativeDate(n.updated_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="section-head">
        <h2>
          <FlashcardsIcon size={16} /> Flashcards
        </h2>
      </div>
      <FlashcardsManager
        workspaceId={mod.workspace_id}
        initialCards={cards}
        modules={allModules}
        notes={allNotes.map((n) => ({ id: n.id, title: n.title }))}
        defaultModuleId={mod.id}
        hideModuleGrouping
      />
    </AppShell>
  );
}

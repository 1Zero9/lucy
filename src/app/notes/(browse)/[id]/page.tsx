import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getNote, listNotes, listVersions } from "@/lib/db/notes";
import { listModules } from "@/lib/db/modules";
import { listFolders } from "@/lib/db/folders";
import { listTags, tagsForNote } from "@/lib/db/tags";
import { listAttachments } from "@/lib/db/attachments";
import { listFlashcards } from "@/lib/db/flashcards";
import { NoteEditor } from "@/components/note-editor";
import { NoteMetaBar } from "@/components/note-meta-bar";
import { AttachmentsManager } from "@/components/attachments-manager";
import { FlashcardsIcon } from "@/components/icons";

export const metadata = { title: "Note · LUCY" };

// No AppShell here — the (browse) layout already provides it, plus the
// persistent subject-tabs/note-list pane this renders alongside.
export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = getDb();

  const note = await getNote(db, user.id, id);
  if (!note) notFound();

  const [versions, folders, modules, allTags, noteTags, attachments, workspaceNotes, relatedCards] =
    await Promise.all([
      listVersions(db, user.id, id),
      listFolders(db, user.id, note.workspace_id),
      listModules(db, user.id, note.workspace_id),
      listTags(db, user.id, note.workspace_id),
      tagsForNote(db, user.id, id),
      listAttachments(db, user.id, note.workspace_id, { noteId: id }),
      listNotes(db, user.id, note.workspace_id),
      listFlashcards(db, user.id, note.workspace_id, { noteId: id })
    ]);

  return (
    <>
      {/* Only meaningful on a narrow viewport, where the list pane is
          hidden while a note is open (see .has-detail in globals.css). */}
      <p className="notes-back-link">
        <Link className="linkish" href="/notes">
          ← All notes
        </Link>
      </p>
      <NoteMetaBar
        noteId={note.id}
        initialColour={note.colour}
        initialPinned={note.is_pinned === 1}
        initialFolderId={note.folder_id}
        initialModuleId={note.module_id}
        modules={modules}
        folders={folders}
        initialTags={noteTags}
        allTags={allTags}
      />
      <NoteEditor
        note={note}
        initialVersions={versions}
        workspaceNotes={workspaceNotes.map((n) => ({ id: n.id, title: n.title }))}
      />
      <AttachmentsManager
        workspaceId={note.workspace_id}
        noteId={note.id}
        initialAttachments={attachments}
      />

      {relatedCards.length > 0 ? (
        <section aria-label="Related flashcards" style={{ marginTop: 24 }}>
          <div className="section-head">
            <h2>
              <FlashcardsIcon size={16} /> Flashcards from this note
            </h2>
            <Link className="linkish" href="/flashcards">
              View all
            </Link>
          </div>
          <ul className="mini-list">
            {relatedCards.map((c) => (
              <li key={c.id}>{c.front}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

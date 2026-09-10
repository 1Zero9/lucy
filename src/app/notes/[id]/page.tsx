import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getNote, listVersions } from "@/lib/db/notes";
import { listFolders } from "@/lib/db/folders";
import { listTags, tagsForNote } from "@/lib/db/tags";
import { listAttachments } from "@/lib/db/attachments";
import { AppShell } from "@/components/app-shell";
import { NoteEditor } from "@/components/note-editor";
import { NoteMetaBar } from "@/components/note-meta-bar";
import { AttachmentsManager } from "@/components/attachments-manager";

export const metadata = { title: "Note · LUCY" };

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = getDb();

  const note = await getNote(db, user.id, id);
  if (!note) notFound();

  const [versions, folders, allTags, noteTags, attachments] = await Promise.all([
    listVersions(db, user.id, id),
    listFolders(db, user.id, note.workspace_id),
    listTags(db, user.id, note.workspace_id),
    tagsForNote(db, user.id, id),
    listAttachments(db, user.id, note.workspace_id, { noteId: id })
  ]);

  return (
    <AppShell active="notes">
      <p style={{ marginTop: 0 }}>
        <Link className="linkish" href="/notes">
          ← All notes
        </Link>
      </p>
      <NoteMetaBar
        noteId={note.id}
        initialColour={note.colour}
        initialPinned={note.is_pinned === 1}
        initialFolderId={note.folder_id}
        folders={folders}
        initialTags={noteTags}
        allTags={allTags}
      />
      <NoteEditor note={note} initialVersions={versions} />
      <AttachmentsManager
        workspaceId={note.workspace_id}
        noteId={note.id}
        initialAttachments={attachments}
      />
    </AppShell>
  );
}

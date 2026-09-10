import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getNote, listVersions } from "@/lib/db/notes";
import { AppShell } from "@/components/app-shell";
import { NoteEditor } from "@/components/note-editor";

export const metadata = { title: "Note · LUCY" };

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = getDb();

  const note = await getNote(db, user.id, id);
  if (!note) notFound();
  const versions = await listVersions(db, user.id, id);

  return (
    <AppShell active="notes">
      <p style={{ marginTop: 0 }}>
        <Link className="linkish" href="/notes">
          ← All notes
        </Link>
      </p>
      <NoteEditor note={note} initialVersions={versions} />
    </AppShell>
  );
}

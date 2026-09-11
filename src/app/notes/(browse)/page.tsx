import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listNotes } from "@/lib/db/notes";
import { EmptyState } from "@/components/empty-state";
import { NotesIcon } from "@/components/icons";
import { NewNoteButton } from "@/components/new-note-button";

export const metadata = { title: "Notes · LUCY" };

export default async function NotesIndexPage() {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const [latestNote] = await listNotes(getDb(), user.id, active.id);
  if (latestNote) redirect(`/notes/${latestNote.id}`);

  return (
    <EmptyState
      icon={<NotesIcon size={22} />}
      title="No notes yet"
      body="Create a note to start capturing ideas."
      action={<NewNoteButton workspaceId={active.id} label="New note" />}
    />
  );
}

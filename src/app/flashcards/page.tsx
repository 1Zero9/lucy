import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listFlashcards, listDueFlashcards } from "@/lib/db/flashcards";
import { listModules } from "@/lib/db/modules";
import { listNotes } from "@/lib/db/notes";
import { AppShell } from "@/components/app-shell";
import { FlashcardsManager } from "@/components/flashcards-manager";

export const metadata = { title: "Flashcards · LUCY" };

export default async function FlashcardsPage() {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const db = getDb();
  const [cards, modules, due, notes] = await Promise.all([
    listFlashcards(db, user.id, active.id),
    listModules(db, user.id, active.id),
    listDueFlashcards(db, user.id, active.id),
    listNotes(db, user.id, active.id)
  ]);

  return (
    <AppShell active="study" workspaceId={active.id}>
      <div className="topbar">
        <div>
          <h1 className="page-title">Flashcards</h1>
          <span className="muted" style={{ fontSize: 14 }}>
            in {active.name}
          </span>
        </div>
        {due.length > 0 ? (
          <Link className="btn" href="/revise" style={{ width: "auto", padding: "0 16px" }}>
            Review {due.length} card{due.length === 1 ? "" : "s"}
          </Link>
        ) : (
          <Link className="linkish" href="/revise">
            Go to revision
          </Link>
        )}
      </div>
      <FlashcardsManager
        workspaceId={active.id}
        initialCards={cards}
        modules={modules}
        notes={notes.map((n) => ({ id: n.id, title: n.title }))}
      />
    </AppShell>
  );
}

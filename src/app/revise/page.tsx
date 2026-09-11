import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listDueFlashcards } from "@/lib/db/flashcards";
import { AppShell } from "@/components/app-shell";
import { RevisionSession } from "@/components/revision-session";

export const metadata = { title: "Revision · LUCY" };

export default async function RevisePage() {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const queue = await listDueFlashcards(getDb(), user.id, active.id);

  return (
    <AppShell active="study">
      <div className="topbar">
        <h1 className="page-title">Revision — {active.name}</h1>
      </div>
      <RevisionSession initialQueue={queue} />
    </AppShell>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listResearch } from "@/lib/db/research";
import { listFlashcards, listDueFlashcards } from "@/lib/db/flashcards";
import { listDrawings } from "@/lib/db/drawings";
import { AppShell } from "@/components/app-shell";

export const metadata = { title: "Study · LUCY" };

export default async function StudyPage() {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const db = getDb();
  const [research, cards, due, drawings] = await Promise.all([
    listResearch(db, user.id, active.id),
    listFlashcards(db, user.id, active.id),
    listDueFlashcards(db, user.id, active.id),
    listDrawings(db, user.id, active.id)
  ]);

  const tools = [
    {
      href: "/revise",
      title: "Revision",
      body:
        due.length > 0
          ? `${due.length} card${due.length === 1 ? "" : "s"} due now`
          : "Nothing due — you're caught up"
    },
    { href: "/flashcards", title: "Flashcards", body: `${cards.length} in this workspace` },
    { href: "/research", title: "Research", body: `${research.length} saved source${research.length === 1 ? "" : "s"}` },
    { href: "/drawings", title: "Drawings", body: `${drawings.length} sketch${drawings.length === 1 ? "" : "es"}` }
  ];

  return (
    <AppShell active="study" workspaceId={active.id}>
      <div className="topbar">
        <div>
          <h1 className="page-title">Study</h1>
          <span className="muted" style={{ fontSize: 14 }}>
            in {active.name}
          </span>
        </div>
      </div>
      <div className="module-grid">
        {tools.map((t) => (
          <Link key={t.href} href={t.href} className="module-card" style={{ textDecoration: "none" }}>
            <h3>{t.title}</h3>
            <p className="muted">{t.body}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

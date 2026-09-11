import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listNotes } from "@/lib/db/notes";
import { AppShell } from "@/components/app-shell";
import { TrashList } from "@/components/trash-list";

export const metadata = { title: "Recently Deleted · LUCY" };

export default async function TrashPage() {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const notes = await listNotes(getDb(), user.id, active.id, { deleted: true });

  return (
    <AppShell active="notes">
      <div className="topbar">
        <div>
          <h1 className="page-title">Recently Deleted</h1>
          <span className="muted" style={{ fontSize: 14 }}>
            in {active.name}
          </span>
        </div>
        <Link className="linkish" href="/notes">
          ← All notes
        </Link>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Deleted notes stay here until you restore them or delete them permanently.
      </p>
      <TrashList initialNotes={notes} />
    </AppShell>
  );
}

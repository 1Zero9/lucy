import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listStickies } from "@/lib/db/stickies";
import { AppShell } from "@/components/app-shell";
import { StickiesBoard } from "@/components/stickies-board";

export const metadata = { title: "Stickies · LUCY" };

export default async function StickiesPage() {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const stickies = await listStickies(getDb(), user.id, active.id);

  return (
    <AppShell active="home" workspaceId={active.id}>
      <div className="topbar">
        <div>
          <h1 className="page-title">Stickies</h1>
          <span className="muted" style={{ fontSize: 14 }}>
            in {active.name}
          </span>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Fast, throwaway capture. Move anything that matters into a note.
      </p>
      <StickiesBoard workspaceId={active.id} initialStickies={stickies} />
    </AppShell>
  );
}

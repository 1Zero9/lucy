import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listResearch } from "@/lib/db/research";
import { AppShell } from "@/components/app-shell";
import { ResearchManager } from "@/components/research-manager";

export const metadata = { title: "Research · LUCY" };

export default async function ResearchPage() {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const items = await listResearch(getDb(), user.id, active.id);

  return (
    <AppShell active="study">
      <div className="topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Research</h1>
          <span className="muted" style={{ fontSize: 14 }}>
            in {active.name}
          </span>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Saved sources and references, each with your own annotation.
      </p>
      <ResearchManager workspaceId={active.id} initialItems={items} />
    </AppShell>
  );
}

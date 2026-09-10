import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listModules } from "@/lib/db/modules";
import { AppShell } from "@/components/app-shell";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { ModulesManager } from "@/components/modules-manager";

export const metadata = { title: "Modules · LUCY" };

export default async function ModulesPage() {
  const user = await requireUser();
  const { active, all } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const modules = await listModules(getDb(), user.id, active.id);

  return (
    <AppShell active="modules">
      <div className="topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Modules</h1>
          <span className="muted" style={{ fontSize: 14 }}>
            in {active.name}
          </span>
        </div>
        <WorkspaceSwitcher workspaces={all} activeId={active.id} />
      </div>

      <ModulesManager workspaceId={active.id} initialModules={modules} />
    </AppShell>
  );
}

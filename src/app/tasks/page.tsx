import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listTasks } from "@/lib/db/tasks";
import { AppShell } from "@/components/app-shell";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { TasksView } from "@/components/tasks-view";

export const metadata = { title: "Tasks · LUCY" };

export default async function TasksPage() {
  const user = await requireUser();
  const { active, all } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const tasks = await listTasks(getDb(), user.id, active.id);

  return (
    <AppShell active="tasks" workspaceId={active.id}>
      <div className="topbar">
        <div>
          <h1 className="page-title">Tasks</h1>
          <span className="muted" style={{ fontSize: 14 }}>
            in {active.name}
          </span>
        </div>
        <WorkspaceSwitcher workspaces={all} activeId={active.id} />
      </div>
      <TasksView workspaceId={active.id} initialTasks={tasks} />
    </AppShell>
  );
}

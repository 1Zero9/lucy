import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { listWorkspaces } from "@/lib/db/workspaces";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { AppShell } from "@/components/app-shell";
import { WorkspacesManager } from "@/components/workspaces-manager";
import { CreateWorkspaceForm } from "@/components/create-workspace-form";

export const metadata = { title: "Workspaces · LUCY" };

export default async function WorkspacesPage() {
  const user = await requireUser();
  const workspaces = await listWorkspaces(getDb(), user.id);
  const { active } = await resolveActiveWorkspace(user.id);

  return (
    <AppShell active="workspaces">
      <div className="topbar">
        <h1 style={{ margin: 0, fontSize: 22 }}>Workspaces</h1>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        A workspace is a top-level learning context — a degree, a certification, a course, a
        personal project. Names and structure are entirely yours.
      </p>

      <WorkspacesManager initialWorkspaces={workspaces} activeId={active?.id ?? ""} />

      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>New workspace</h2>
      </div>
      <CreateWorkspaceForm />
    </AppShell>
  );
}

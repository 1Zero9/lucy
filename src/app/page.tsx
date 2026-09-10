import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listModules } from "@/lib/db/modules";
import { AppShell } from "@/components/app-shell";
import { SignOutButton } from "@/components/sign-out-button";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { ModuleGrid } from "@/components/module-grid";

export default async function Page() {
  const user = await requireUser();
  const { active, all } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const modules = await listModules(getDb(), user.id, active.id);

  return (
    <AppShell active="home">
      <div className="topbar">
        <WorkspaceSwitcher workspaces={all} activeId={active.id} />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="who">{user.email}</span>
          <SignOutButton />
        </div>
      </div>

      <section className="hero">
        <h1>{active.name}</h1>
        <p>{active.purpose ?? "Capture. Organise. Learn. Succeed."}</p>
      </section>

      <input className="search" aria-label="Search" placeholder="Search anything…" disabled />

      <div className="section-head">
        <h2>Modules</h2>
        <Link className="linkish" href="/modules">
          Manage modules
        </Link>
      </div>
      <ModuleGrid modules={modules} />
    </AppShell>
  );
}

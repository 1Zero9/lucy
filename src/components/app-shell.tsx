import Link from "next/link";
import type { ReactNode } from "react";

type Section = "home" | "notes" | "modules" | "files" | "tasks" | "workspaces" | "settings";

export function AppShell({
  children,
  active
}: {
  children: ReactNode;
  active?: Section;
}) {
  const cur = (s: Section) => (active === s ? "page" : undefined);
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">LUCY</div>
        <nav className="nav" aria-label="Primary">
          <Link href="/" aria-current={cur("home")}>
            Home
          </Link>
          <Link href="/modules" aria-current={cur("modules")}>
            Modules
          </Link>
          <Link href="/notes" aria-current={cur("notes")}>
            Notes
          </Link>
          <Link href="/files" aria-current={cur("files")}>
            Files
          </Link>
          <Link href="/tasks" aria-current={cur("tasks")}>
            Tasks
          </Link>
          <Link href="/workspaces" aria-current={cur("workspaces")}>
            Workspaces
          </Link>
          <Link href="/settings" aria-current={cur("settings")}>
            Settings
          </Link>
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

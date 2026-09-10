import Link from "next/link";
import type { ReactNode } from "react";

type Section = "home" | "modules" | "workspaces" | "settings";

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
          <a href="#" aria-disabled="true">
            Notes
          </a>
          <a href="#" aria-disabled="true">
            Tasks
          </a>
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

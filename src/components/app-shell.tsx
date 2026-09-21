import Link from "next/link";
import type { ReactNode } from "react";
import {
  ModulesIcon,
  MoreIcon,
  SearchIcon,
  SettingsIcon
} from "@/components/icons";
import { MobileNav } from "@/components/mobile-nav";
import { NewNoteButton } from "@/components/new-note-button";

export type Section =
  | "home"
  | "search"
  | "notes"
  | "modules"
  | "files"
  | "tasks"
  | "study"
  | "workspaces"
  | "settings"
  | "help";

export function AppShell({
  children,
  active,
  workspaceId
}: {
  children: ReactNode;
  active?: Section;
  /** Active workspace, if the page has one resolved — feeds the mobile "+" fast-capture sheet. */
  workspaceId?: string;
}) {
  return (
    <div className="shell">
      <header className="masthead">
        <Link href="/" className="brand" aria-label="LUCY home">
          <img src="/icons/lucy-app-icon-64.png" alt="" width={28} height={28} />
          <span>LUCY</span>
        </Link>
        <nav className="masthead-nav" aria-label="Primary">
          <Link href="/modules" aria-current={active === "modules" ? "page" : undefined}>
            <ModulesIcon size={17} />
            Notebooks
          </Link>
          <Link href="/search" aria-current={active === "search" ? "page" : undefined}>
            <SearchIcon size={17} />
            Find
          </Link>
        </nav>
        {workspaceId ? (
          <div className="masthead-capture">
            <NewNoteButton workspaceId={workspaceId} label="Capture" />
          </div>
        ) : null}
        <Link href="/settings" className="masthead-settings" aria-label="Settings" title="Settings">
          <SettingsIcon size={18} />
        </Link>
        {/* Mobile retains its existing navigation design in Phase 1. */}
        <Link href="/more" className="masthead-more-link" aria-label="More">
          <MoreIcon size={20} />
        </Link>
      </header>
      <main className="main">{children}</main>
      <MobileNav active={active} workspaceId={workspaceId} />
    </div>
  );
}

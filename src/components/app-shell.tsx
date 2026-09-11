import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArchiveIcon,
  FilesIcon,
  HelpIcon,
  HomeIcon,
  ModulesIcon,
  NotesIcon,
  RevisionsIcon,
  SearchIcon,
  SettingsIcon,
  TasksIcon
} from "@/components/icons";
import { MobileNav } from "@/components/mobile-nav";

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

type NavItem = {
  section: Section;
  href: string;
  label: string;
  icon: typeof HomeIcon;
  /** Also on the mobile bottom bar (MobileNav) — drop the duplicate from this list on phones. */
  onMobileBar?: boolean;
};

const PRIMARY: NavItem[] = [
  { section: "home", href: "/", label: "Home", icon: HomeIcon, onMobileBar: true },
  { section: "search", href: "/search", label: "Search", icon: SearchIcon, onMobileBar: true },
  { section: "notes", href: "/notes", label: "Notes", icon: NotesIcon },
  { section: "modules", href: "/modules", label: "Modules", icon: ModulesIcon, onMobileBar: true },
  { section: "tasks", href: "/tasks", label: "Tasks", icon: TasksIcon, onMobileBar: true }
];

// "Study" groups Research / Flashcards / Revision / Drawing behind one hub
// (see /study) rather than four separate rail entries — keeps navigation
// restrained per docs/LUCY_STYLE_GUIDE.md §7 while still covering §12-§15.
const SECONDARY: { section: Section; href: string; label: string; icon: typeof HomeIcon }[] = [
  { section: "files", href: "/files", label: "Files", icon: FilesIcon },
  { section: "study", href: "/study", label: "Study", icon: RevisionsIcon }
];

const UTILITY: { section: Section; href: string; label: string; icon: typeof HomeIcon }[] = [
  { section: "workspaces", href: "/workspaces", label: "Workspaces", icon: ArchiveIcon },
  { section: "help", href: "/help", label: "Help", icon: HelpIcon },
  { section: "settings", href: "/settings", label: "Settings", icon: SettingsIcon }
];

function NavGroup({
  label,
  items,
  active
}: {
  label?: string;
  items: typeof PRIMARY;
  active?: Section;
}) {
  return (
    <div className="nav-group">
      {label ? <div className="nav-label">{label}</div> : null}
      <nav className="nav" aria-label={label ?? "Primary"}>
        {items.map(({ section, href, label: text, icon: Icon, onMobileBar }) => (
          <Link
            key={section}
            href={href}
            className={onMobileBar ? "nav-mobile-hide" : undefined}
            aria-current={active === section ? "page" : undefined}
          >
            <Icon size={20} />
            {text}
          </Link>
        ))}
      </nav>
    </div>
  );
}

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
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="LUCY home">
          <img src="/icons/lucy-app-icon-64.png" alt="" width={28} height={28} />
          <span>LUCY</span>
        </Link>
        <NavGroup items={PRIMARY} active={active} />
        <NavGroup label="Study" items={SECONDARY} active={active} />
        <NavGroup label="Account" items={UTILITY} active={active} />
      </aside>
      <main className="main">{children}</main>
      <MobileNav active={active} workspaceId={workspaceId} />
    </div>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArchiveIcon,
  FilesIcon,
  HomeIcon,
  ModulesIcon,
  NotesIcon,
  RevisionsIcon,
  SearchIcon,
  SettingsIcon,
  TasksIcon
} from "@/components/icons";

type Section =
  | "home"
  | "search"
  | "notes"
  | "modules"
  | "files"
  | "tasks"
  | "study"
  | "workspaces"
  | "settings";

const PRIMARY: { section: Section; href: string; label: string; icon: typeof HomeIcon }[] = [
  { section: "home", href: "/", label: "Home", icon: HomeIcon },
  { section: "search", href: "/search", label: "Search", icon: SearchIcon },
  { section: "notes", href: "/notes", label: "Notes", icon: NotesIcon },
  { section: "modules", href: "/modules", label: "Modules", icon: ModulesIcon },
  { section: "tasks", href: "/tasks", label: "Tasks", icon: TasksIcon }
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
        {items.map(({ section, href, label: text, icon: Icon }) => (
          <Link key={section} href={href} aria-current={active === section ? "page" : undefined}>
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
  active
}: {
  children: ReactNode;
  active?: Section;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="LUCY home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/lucy-app-icon-64.png" alt="" width={28} height={28} />
          <span>LUCY</span>
        </Link>
        <NavGroup items={PRIMARY} active={active} />
        <NavGroup label="Study" items={SECONDARY} active={active} />
        <NavGroup label="Account" items={UTILITY} active={active} />
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

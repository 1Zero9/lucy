import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { SignOutButton } from "@/components/sign-out-button";
import {
  ArchiveIcon,
  FilesIcon,
  HelpIcon,
  NotesIcon,
  RevisionsIcon,
  SettingsIcon
} from "@/components/icons";

export const metadata = { title: "More · LUCY" };

/**
 * Mobile-only landing for everything that doesn't fit the bottom bar (Home,
 * Modules, Create, Tasks, Search) — Notes, Files, Study, Workspaces, Help,
 * Settings, and sign out. Reached from the "More" icon next to the brand on
 * phones (UPGRADE.md — no duplicated desktop nav above mobile content).
 * On desktop these all already live in the sidebar, so this page is unlinked
 * there; visiting it directly still works.
 */
export default async function MorePage() {
  const user = await requireUser();

  const links = [
    { href: "/notes", label: "Notes", icon: NotesIcon },
    { href: "/files", label: "Files", icon: FilesIcon },
    { href: "/study", label: "Study", icon: RevisionsIcon },
    { href: "/workspaces", label: "Workspaces", icon: ArchiveIcon },
    { href: "/help", label: "Help", icon: HelpIcon },
    { href: "/settings", label: "Settings", icon: SettingsIcon }
  ];

  return (
    <AppShell>
      <div className="topbar">
        <h1 className="page-title">More</h1>
      </div>

      <ul className="more-list">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href}>
              <Icon size={20} />
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="more-account">
        <span className="who">{user.email}</span>
        <SignOutButton />
      </div>
    </AppShell>
  );
}

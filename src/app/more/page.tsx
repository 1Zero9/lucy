import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { SignOutButton } from "@/components/sign-out-button";
import {
  ArchiveIcon,
  FilesIcon,
  HelpIcon,
  HomeIcon,
  RevisionsIcon,
  SettingsIcon,
  TasksIcon
} from "@/components/icons";

export const metadata = { title: "More · LUCY" };

/**
 * Mobile-only landing for everything that doesn't fit the bottom bar (Notes,
 * Subjects, Create, Review, Search — UPGRADE.md §6 prioritises notes over
 * Home/Tasks there) — Home, Tasks, Files, Study, Workspaces, Help, Settings,
 * and sign out. Reached from the "More" icon next to the brand on phones.
 * On desktop these all already live in the sidebar, so this page is unlinked
 * there; visiting it directly still works.
 */
export default async function MorePage() {
  const user = await requireUser();

  const links = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/tasks", label: "Tasks", icon: TasksIcon },
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

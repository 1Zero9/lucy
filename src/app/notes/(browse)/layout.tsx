import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { AppShell } from "@/components/app-shell";

/**
 * Notes is a focused writing surface. Recently Deleted remains a dedicated
 * screen, while the left application rail handles product navigation.
 */
export default async function NotesBrowseLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  return (
    <AppShell active="notes" workspaceId={active.id}>
      <div className="notes-workspace">
        <header className="notes-workspace-header">
          <div>
            <span className="notes-workspace-kicker">{active.name}</span>
            <h1 className="page-title">Notes</h1>
          </div>
          <Link className="linkish" href="/notes/trash">
            Recently Deleted
          </Link>
        </header>

        <div className="notes-editor-pane">{children}</div>
      </div>
    </AppShell>
  );
}

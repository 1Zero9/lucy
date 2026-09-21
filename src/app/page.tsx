import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listModules } from "@/lib/db/modules";
import { listNotes } from "@/lib/db/notes";
import { listTasks } from "@/lib/db/tasks";
import { AppShell } from "@/components/app-shell";
import { Desk } from "@/components/desk";
import { SearchShortcut } from "@/components/search-shortcut";

export default async function Page() {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const db = getDb();
  const [notes, tasks, modules] = await Promise.all([
    listNotes(db, user.id, active.id),
    listTasks(db, user.id, active.id, { status: "open" }),
    listModules(db, user.id, active.id)
  ]);

  return (
    <AppShell active="home" workspaceId={active.id}>
      <SearchShortcut />
      <Desk notes={notes} tasks={tasks} modules={modules} />
    </AppShell>
  );
}

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listAttachments } from "@/lib/db/attachments";
import { AppShell } from "@/components/app-shell";
import { AttachmentsManager } from "@/components/attachments-manager";

export const metadata = { title: "Files · LUCY" };

export default async function FilesPage() {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const attachments = await listAttachments(getDb(), user.id, active.id);

  return (
    <AppShell active="files">
      <div className="topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Files</h1>
          <span className="muted" style={{ fontSize: 14 }}>
            in {active.name}
          </span>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Everything you&apos;ve uploaded in this workspace. Files stay private — they&apos;re only
        served to you through the app.
      </p>
      <AttachmentsManager workspaceId={active.id} initialAttachments={attachments} />
    </AppShell>
  );
}

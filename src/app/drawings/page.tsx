import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolveActiveWorkspace } from "@/lib/workspace-context";
import { listDrawings } from "@/lib/db/drawings";
import { AppShell } from "@/components/app-shell";
import { NewDrawingButton } from "@/components/new-drawing-button";
import { DrawingIcon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Drawings · LUCY" };

export default async function DrawingsPage() {
  const user = await requireUser();
  const { active } = await resolveActiveWorkspace(user.id);
  if (!active) redirect("/onboarding");

  const drawings = await listDrawings(getDb(), user.id, active.id);

  return (
    <AppShell active="study" workspaceId={active.id}>
      <div className="topbar">
        <div>
          <h1 className="page-title">Drawings</h1>
          <span className="muted" style={{ fontSize: 14 }}>
            in {active.name}
          </span>
        </div>
        <NewDrawingButton workspaceId={active.id} />
      </div>

      {drawings.length === 0 ? (
        <EmptyState
          icon={<DrawingIcon size={22} />}
          title="No drawings yet"
          body="A simple freehand canvas for sketches and diagrams — start one above."
        />
      ) : (
        <div className="module-grid">
          {drawings.map((d) => (
            <Link key={d.id} href={`/drawings/${d.id}`} className="module-card" style={{ textDecoration: "none", padding: 0, overflow: "hidden" }}>
              <img
                src={`/api/drawings/${d.id}/download`}
                alt={d.title}
                style={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover", background: "#fff" }}
              />
              <span style={{ padding: 12, display: "block", fontWeight: 600 }}>{d.title}</span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

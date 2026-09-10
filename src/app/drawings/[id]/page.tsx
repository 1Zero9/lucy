import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getDrawing } from "@/lib/db/drawings";
import { AppShell } from "@/components/app-shell";
import { DrawingCanvas } from "@/components/drawing-canvas";

export const metadata = { title: "Drawing · LUCY" };

export default async function DrawingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const drawing = await getDrawing(getDb(), user.id, id);
  if (!drawing) notFound();

  return (
    <AppShell active="study">
      <p style={{ marginTop: 0 }}>
        <Link className="linkish" href="/drawings">
          ← All drawings
        </Link>
      </p>
      <DrawingCanvas drawing={drawing} />
    </AppShell>
  );
}

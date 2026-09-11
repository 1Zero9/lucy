"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { friendlyError } from "@/lib/errors";

export function NewDrawingButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 800;
      const c = canvas.getContext("2d")!;
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("Could not create the canvas.");

      const form = new FormData();
      form.set("file", new File([blob], "drawing.png", { type: "image/png" }));
      form.set("width", "1280");
      form.set("height", "800");
      const res = await fetch(`/api/workspaces/${workspaceId}/drawings`, { method: "POST", body: form });
      const body: unknown = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string })?.error ?? "Could not create drawing.");
      router.push(`/drawings/${(body as { drawing: { id: string } }).drawing.id}`);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  return (
    <span>
      <button className="btn" type="button" onClick={create} disabled={busy} style={{ width: "auto", padding: "0 16px" }}>
        {busy ? "Creating…" : "New drawing"}
      </button>
      {error ? <span className="form-error" style={{ marginLeft: 10 }}>{error}</span> : null}
    </span>
  );
}

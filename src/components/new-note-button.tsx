"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Note } from "@/lib/db/notes";
import { friendlyError } from "@/lib/errors";

export function NewNoteButton({
  workspaceId,
  moduleId,
  label = "New note"
}: {
  workspaceId: string;
  moduleId?: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(moduleId ? { moduleId } : {})
      });
      const body: unknown = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string })?.error ?? "Could not create note.");
      const { note } = body as { note: Note };
      router.push(`/notes/${note.id}`);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  return (
    <span>
      <button className="btn" type="button" onClick={create} disabled={busy} style={{ width: "auto", padding: "0 16px" }}>
        {busy ? "Creating…" : label}
      </button>
      {error ? (
        <span className="form-error" style={{ marginLeft: 10 }}>
          {error}
        </span>
      ) : null}
    </span>
  );
}

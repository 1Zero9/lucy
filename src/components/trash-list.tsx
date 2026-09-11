"use client";

import { useState } from "react";
import type { Note } from "@/lib/db/notes";
import { friendlyError } from "@/lib/errors";

async function post(path: string) {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" } });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? "Request failed.");
}

export function TrashList({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [error, setError] = useState<string | null>(null);

  async function restore(id: string) {
    setError(null);
    try {
      await post(`/api/notes/${id}/restore`);
      setNotes((n) => n.filter((x) => x.id !== id));
    } catch (e) {
      setError(friendlyError(e));
    }
  }

  async function purge(id: string, title: string) {
    if (!window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await post(`/api/notes/${id}/purge`);
      setNotes((n) => n.filter((x) => x.id !== id));
    } catch (e) {
      setError(friendlyError(e));
    }
  }

  if (notes.length === 0) {
    return <div className="empty">Recently Deleted is empty.</div>;
  }

  return (
    <div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="trash-list">
        {notes.map((n) => (
          <li key={n.id}>
            <span>
              <strong>{n.title}</strong>
              {n.deleted_at ? (
                <span className="muted"> · deleted {new Date(n.deleted_at).toLocaleString()}</span>
              ) : null}
            </span>
            <span className="row">
              <button className="linkish" type="button" onClick={() => restore(n.id)}>
                Restore
              </button>
              <button
                className="linkish danger"
                type="button"
                onClick={() => purge(n.id, n.title)}
              >
                Delete permanently
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

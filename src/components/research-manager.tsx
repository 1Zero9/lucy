"use client";

import { useState } from "react";
import type { ResearchItem } from "@/lib/db/research";
import { Markdown } from "@/components/markdown";
import { friendlyError } from "@/lib/errors";

async function jsonOrThrow(res: Response) {
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? "Request failed.");
  return body;
}

export function ResearchManager({
  workspaceId,
  initialItems
}: {
  workspaceId: string;
  initialItems: ResearchItem[];
}) {
  const [items, setItems] = useState<ResearchItem[]>(initialItems);
  const [deleted, setDeleted] = useState<ResearchItem[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [annotation, setAnnotation] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    try {
      const { item } = (await jsonOrThrow(
        await fetch(`/api/workspaces/${workspaceId}/research`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: title.trim(), url: url.trim() || null })
        })
      )) as { item: ResearchItem };
      setItems((x) => [item, ...x]);
      setTitle("");
      setUrl("");
    } catch (e2) {
      setError(friendlyError(e2));
    }
  }

  async function saveAnnotation(id: string) {
    setError(null);
    try {
      const { item } = (await jsonOrThrow(
        await fetch(`/api/research/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ annotation })
        })
      )) as { item: ResearchItem };
      setItems((x) => x.map((i) => (i.id === id ? item : i)));
      setEditing(null);
    } catch (e2) {
      setError(friendlyError(e2));
    }
  }

  async function remove(it: ResearchItem) {
    setError(null);
    try {
      await jsonOrThrow(await fetch(`/api/research/${it.id}`, { method: "DELETE" }));
      setItems((x) => x.filter((i) => i.id !== it.id));
      setDeleted((d) => [it, ...d]);
    } catch (e2) {
      setError(friendlyError(e2));
    }
  }

  async function undo(it: ResearchItem) {
    setError(null);
    try {
      await jsonOrThrow(await fetch(`/api/research/${it.id}/restore`, { method: "POST" }));
      setItems((x) => [it, ...x]);
      setDeleted((d) => d.filter((i) => i.id !== it.id));
    } catch (e2) {
      setError(friendlyError(e2));
    }
  }

  return (
    <div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="inline-form" onSubmit={add} style={{ marginBottom: 18 }}>
        <input
          aria-label="Source title"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          aria-label="Source URL"
          placeholder="https:// (optional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="btn" type="submit" disabled={!title.trim()}>
          Add
        </button>
      </form>

      {deleted.map((d) => (
        <div className="undo-row" key={d.id}>
          <span>
            Deleted <strong>{d.title}</strong>.
          </span>
          <button className="linkish" type="button" onClick={() => undo(d)}>
            Undo
          </button>
        </div>
      ))}

      {items.length === 0 ? (
        <div className="empty">No saved sources yet.</div>
      ) : (
        <ul className="note-list">
          {items.map((it) => (
            <li key={it.id}>
              <div style={{ padding: "14px 16px", border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", display: "grid", gap: 6 }}>
                <span className="note-list-title">
                  {it.url ? (
                    <a href={it.url} target="_blank" rel="noreferrer">
                      {it.title}
                    </a>
                  ) : (
                    it.title
                  )}
                </span>
                {editing === it.id ? (
                  <div className="field">
                    <textarea
                      aria-label="Annotation"
                      rows={4}
                      value={annotation}
                      onChange={(e) => setAnnotation(e.target.value)}
                      style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10, font: "inherit" }}
                    />
                    <div className="row">
                      <button className="btn" type="button" onClick={() => saveAnnotation(it.id)} style={{ width: "auto", padding: "0 16px" }}>
                        Save
                      </button>
                      <button className="linkish" type="button" onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {it.annotation ? <Markdown source={it.annotation} /> : <span className="muted">No notes yet.</span>}
                    <div className="row">
                      <button
                        className="linkish"
                        type="button"
                        onClick={() => {
                          setEditing(it.id);
                          setAnnotation(it.annotation);
                        }}
                      >
                        {it.annotation ? "Edit notes" : "Add notes"}
                      </button>
                      <button className="linkish danger" type="button" onClick={() => remove(it)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { switchWorkspaceAction } from "@/app/actions";
import type { Workspace } from "@/lib/db/workspaces";
import { friendlyError } from "@/lib/errors";
import { ArchiveIcon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";

async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) }
  });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string })?.error ?? "Request failed.");
  }
  return body as T;
}

export function WorkspacesManager({
  initialWorkspaces,
  activeId
}: {
  initialWorkspaces: Workspace[];
  activeId: string;
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [deleted, setDeleted] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function saveRename(id: string) {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setError(null);
    try {
      const { workspace } = await api<{ workspace: Workspace }>(`/api/workspaces/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: trimmed })
      });
      setWorkspaces((w) => w.map((x) => (x.id === id ? workspace : x)));
      setEditing(null);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function remove(ws: Workspace) {
    setError(null);
    try {
      await api(`/api/workspaces/${ws.id}`, { method: "DELETE" });
      setWorkspaces((w) => w.filter((x) => x.id !== ws.id));
      setDeleted((d) => [{ id: ws.id, name: ws.name }, ...d]);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function undo(id: string) {
    setError(null);
    try {
      await api(`/api/workspaces/${id}/restore`, { method: "POST" });
      const { workspaces: fresh } = await api<{ workspaces: Workspace[] }>(`/api/workspaces`);
      setWorkspaces(fresh);
      setDeleted((d) => d.filter((x) => x.id !== id));
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {deleted.map((d) => (
        <div className="undo-row" key={d.id}>
          <span>
            Deleted <strong>{d.name}</strong>.
          </span>
          <button className="linkish" type="button" onClick={() => undo(d.id)}>
            Undo
          </button>
        </div>
      ))}

      {workspaces.length === 0 ? (
        <EmptyState
          icon={<ArchiveIcon size={22} />}
          title="No workspaces yet"
          body="A workspace is a top-level learning context — a degree, a certification, a course, a personal project. Create one below."
        />
      ) : (
        <div className="module-grid">
          {workspaces.map((ws) => (
            <article className="module-card" key={ws.id}>
              {editing === ws.id ? (
                <form
                  className="inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveRename(ws.id);
                  }}
                >
                  <input
                    aria-label="Workspace name"
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                  <button className="btn" type="submit">
                    Save
                  </button>
                  <button className="linkish" type="button" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span
                    className="icon-badge"
                    style={{ "--badge-colour": ws.colour ?? "#7C3AED" } as React.CSSProperties}
                  >
                    {ws.name.charAt(0).toUpperCase()}
                  </span>
                  <h3>
                    {ws.name}
                    {ws.id === activeId ? <span className="muted"> · current</span> : null}
                  </h3>
                  {ws.purpose ? <p className="muted">{ws.purpose}</p> : null}
                  <div className="row">
                    {ws.id === activeId ? null : (
                      <form action={switchWorkspaceAction}>
                        <input type="hidden" name="workspaceId" value={ws.id} />
                        <button className="linkish" type="submit">
                          Switch to
                        </button>
                      </form>
                    )}
                    <button
                      className="linkish"
                      type="button"
                      onClick={() => {
                        setEditing(ws.id);
                        setEditValue(ws.name);
                      }}
                    >
                      Rename
                    </button>
                    <button className="linkish danger" type="button" onClick={() => remove(ws)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

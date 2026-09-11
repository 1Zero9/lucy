"use client";

import { useState } from "react";
import Link from "next/link";
import type { Module } from "@/lib/db/modules";
import { friendlyError } from "@/lib/errors";
import { ModulesIcon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";

type Props = {
  workspaceId: string;
  initialModules: Module[];
};

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

export function ModulesManager({ workspaceId, initialModules }: Props) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [deleted, setDeleted] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const { module } = await api<{ module: Module }>(`/api/workspaces/${workspaceId}/modules`, {
        method: "POST",
        body: JSON.stringify({ name: trimmed })
      });
      setModules((m) => [...m, module]);
      setName("");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveRename(id: string) {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setError(null);
    try {
      const { module } = await api<{ module: Module }>(`/api/modules/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: trimmed })
      });
      setModules((m) => m.map((x) => (x.id === id ? module : x)));
      setEditing(null);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function remove(mod: Module) {
    setError(null);
    try {
      await api(`/api/modules/${mod.id}`, { method: "DELETE" });
      setModules((m) => m.filter((x) => x.id !== mod.id));
      setDeleted((d) => [{ id: mod.id, name: mod.name }, ...d]);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function undo(id: string) {
    setError(null);
    try {
      await api(`/api/modules/${id}/restore`, { method: "POST" });
      const { modules: fresh } = await api<{ modules: Module[] }>(
        `/api/workspaces/${workspaceId}/modules`
      );
      setModules(fresh);
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

      <form className="inline-form" onSubmit={create} style={{ marginBottom: 18 }}>
        <input
          aria-label="New module name"
          placeholder="Add a module or subject…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn" type="submit" disabled={busy || !name.trim()}>
          Add subject
        </button>
      </form>

      {modules.length === 0 ? (
        <EmptyState
          icon={<ModulesIcon size={22} />}
          title="No modules yet"
          body="Add your first one above — a subject, topic or unit inside this workspace."
        />
      ) : (
        <div className="module-grid">
          {modules.map((mod) => (
            <article
              className="module-card"
              key={mod.id}
              style={{ borderLeftColor: mod.colour }}
            >
              {editing === mod.id ? (
                <form
                  className="inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveRename(mod.id);
                  }}
                >
                  <input
                    aria-label="Module name"
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                  <button className="btn" type="submit">
                    Save
                  </button>
                  <button
                    className="linkish"
                    type="button"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <Link href={`/modules/${mod.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    {mod.code ? <span className="code">{mod.code}</span> : null}
                    <h3>{mod.name}</h3>
                    {mod.description ? <p className="muted">{mod.description}</p> : null}
                  </Link>
                  <div className="row">
                    <button
                      className="linkish"
                      type="button"
                      onClick={() => {
                        setEditing(mod.id);
                        setEditValue(mod.name);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="linkish danger"
                      type="button"
                      onClick={() => remove(mod)}
                    >
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

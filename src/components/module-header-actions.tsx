"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Module } from "@/lib/db/modules";
import { friendlyError } from "@/lib/errors";

async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) }
  });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? "Request failed.");
  return body as T;
}

/**
 * Rename/delete for a module's own page — kept off the module card face
 * (UPGRADE.md §4: clickable cards should open their content; rename/delete
 * belong in a menu) and out of the way of the notes/flashcards below.
 */
export function ModuleHeaderActions({ module: mod }: { module: Module }) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(mod.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveRename() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/modules/${mod.id}`, { method: "PATCH", body: JSON.stringify({ name: trimmed }) });
      setRenaming(false);
      router.refresh();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${mod.name}"? Its notes and flashcards keep their content and can be moved elsewhere.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api(`/api/modules/${mod.id}`, { method: "DELETE" });
      router.push("/modules");
      router.refresh();
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  if (renaming) {
    return (
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          saveRename();
        }}
      >
        <input aria-label="Module name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn" type="submit" disabled={busy} style={{ width: "auto", padding: "0 16px" }}>
          Save
        </button>
        <button className="linkish" type="button" onClick={() => setRenaming(false)}>
          Cancel
        </button>
        {error ? <span className="form-error">{error}</span> : null}
      </form>
    );
  }

  return (
    <div className="row">
      <button className="linkish" type="button" onClick={() => setRenaming(true)}>
        Rename
      </button>
      <button className="linkish danger" type="button" onClick={remove} disabled={busy}>
        Delete subject
      </button>
      {error ? <span className="form-error">{error}</span> : null}
    </div>
  );
}

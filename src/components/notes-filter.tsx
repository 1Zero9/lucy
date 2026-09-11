"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Folder } from "@/lib/db/folders";
import type { Tag } from "@/lib/db/tags";
import { friendlyError } from "@/lib/errors";

async function send(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!res.ok) {
    const b: unknown = await res.json().catch(() => ({}));
    throw new Error((b as { error?: string })?.error ?? "Request failed.");
  }
}

export function NotesFilter({
  workspaceId,
  folders,
  tags,
  activeFolder,
  activeTag
}: {
  workspaceId: string;
  folders: Folder[];
  tags: Tag[];
  activeFolder: string | null; // id | "none" | null (= all)
  activeTag: string | null;
}) {
  const router = useRouter();
  const [newFolder, setNewFolder] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function go(next: { folder?: string | null; tag?: string | null }) {
    const params = new URLSearchParams();
    const folder = next.folder === undefined ? activeFolder : next.folder;
    const tag = next.tag === undefined ? activeTag : next.tag;
    if (folder) params.set("folder", folder);
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    router.push(qs ? `/notes?${qs}` : "/notes");
  }

  function guard(p: Promise<unknown>) {
    p.then(() => router.refresh()).catch((e) => setError(friendlyError(e)));
  }

  const chip = (label: string, value: string | null, active: boolean) => (
    <button
      key={label}
      type="button"
      className={`chip-btn${active ? " on" : ""}`}
      onClick={() => go({ folder: value })}
    >
      {label}
    </button>
  );

  return (
    <div className="notes-filter">
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="chip-row">
        {chip("All notes", null, !activeFolder)}
        {chip("No folder", "none", activeFolder === "none")}
        {folders.map((f) =>
          editing === f.id ? (
            <form
              key={f.id}
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!editValue.trim()) return;
                guard(send(`/api/folders/${f.id}`, "PATCH", { name: editValue.trim() }));
                setEditing(null);
              }}
            >
              <input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} />
              <button className="btn" type="submit">
                Save
              </button>
            </form>
          ) : (
            <span key={f.id} className={`chip-btn folder${activeFolder === f.id ? " on" : ""}`}>
              <button type="button" onClick={() => go({ folder: f.id })}>
                {f.name}
              </button>
              <button
                type="button"
                aria-label={`Rename ${f.name}`}
                onClick={() => {
                  setEditing(f.id);
                  setEditValue(f.name);
                }}
              >
                ✎
              </button>
              <button
                type="button"
                aria-label={`Delete ${f.name}`}
                onClick={() => guard(send(`/api/folders/${f.id}`, "DELETE"))}
              >
                ×
              </button>
            </span>
          )
        )}
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newFolder.trim()) return;
            guard(
              send(`/api/workspaces/${workspaceId}/folders`, "POST", { name: newFolder.trim() })
            );
            setNewFolder("");
          }}
        >
          <input
            aria-label="New folder name"
            placeholder="+ New folder"
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
          />
        </form>
      </div>

      {tags.length > 0 ? (
        <label className="meta-field">
          <span className="muted">Tag</span>
          <select
            value={activeTag ?? ""}
            onChange={(e) => go({ tag: e.target.value || null })}
          >
            <option value="">Any</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

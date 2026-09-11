"use client";

import { useState } from "react";
import type { Folder } from "@/lib/db/folders";
import type { Tag } from "@/lib/db/tags";
import type { Module } from "@/lib/db/modules";
import { friendlyError } from "@/lib/errors";

const PALETTE = ["#EDE9FE", "#DBEAFE", "#DCFCE7", "#FEF9C3", "#FEE2E2", "#F3E8FF"];

async function send(path: string, method: string, body: unknown) {
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const b: unknown = await res.json().catch(() => ({}));
    throw new Error((b as { error?: string })?.error ?? "Request failed.");
  }
  return res.json();
}

export function NoteMetaBar({
  noteId,
  initialColour,
  initialPinned,
  initialFolderId,
  initialModuleId,
  modules,
  folders,
  initialTags,
  allTags
}: {
  noteId: string;
  initialColour: string | null;
  initialPinned: boolean;
  initialFolderId: string | null;
  initialModuleId: string | null;
  modules: Module[];
  folders: Folder[];
  initialTags: Tag[];
  allTags: Tag[];
}) {
  const [colour, setColour] = useState(initialColour);
  const [pinned, setPinned] = useState(initialPinned);
  const [folderId, setFolderId] = useState(initialFolderId ?? "");
  const [moduleId, setModuleId] = useState(initialModuleId ?? "");
  const [tags, setTags] = useState<string[]>(initialTags.map((t) => t.name));
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function guard(p: Promise<unknown>) {
    p.catch((e) => setError(friendlyError(e)));
  }

  function patch(fields: Record<string, unknown>) {
    guard(send(`/api/notes/${noteId}`, "PATCH", fields));
  }

  function saveTags(next: string[]) {
    setTags(next);
    guard(send(`/api/notes/${noteId}/tags`, "PUT", { tags: next }));
  }

  function addDraft() {
    const parts = draft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const merged = [...new Set([...tags, ...parts])];
    setDraft("");
    saveTags(merged);
  }

  return (
    <div className="meta-bar">
      {error ? (
        <span className="form-error" style={{ width: "100%" }}>
          {error}
        </span>
      ) : null}

      <label className="meta-field subject-field">
        <span className="muted">Subject</span>
        <select
          value={moduleId}
          onChange={(e) => {
            const v = e.target.value;
            setModuleId(v);
            patch({ moduleId: v || null });
          }}
        >
          <option value="">No subject</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className={`pin-toggle${pinned ? " on" : ""}`}
        aria-pressed={pinned}
        onClick={() => {
          const next = !pinned;
          setPinned(next);
          patch({ isPinned: next });
        }}
      >
        {pinned ? "★ Pinned" : "☆ Pin"}
      </button>

      {/* Colour/folder/tags are secondary to Subject — collapsed by default
          so they don't compete with the writing surface for space,
          especially on a phone (UPGRADE.md §3/§5). */}
      <details className="meta-details">
        <summary>Details</summary>
        <div className="meta-details-body">
          <span className="swatches" role="group" aria-label="Note colour">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch${colour === c ? " sel" : ""}`}
                style={{ background: c }}
                aria-label={`Colour ${c}`}
                aria-pressed={colour === c}
                onClick={() => {
                  setColour(c);
                  patch({ colour: c });
                }}
              />
            ))}
            <button
              type="button"
              className={`swatch clear${!colour ? " sel" : ""}`}
              aria-label="No colour"
              aria-pressed={!colour}
              onClick={() => {
                setColour(null);
                patch({ colour: null });
              }}
            >
              ⊘
            </button>
          </span>

          <label className="meta-field">
            <span className="muted">Folder</span>
            <select
              value={folderId}
              onChange={(e) => {
                const v = e.target.value;
                setFolderId(v);
                patch({ folderId: v || null });
              }}
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>

          <div className="meta-field tags-field">
            <span className="muted">Tags</span>
            <span className="chips">
              {tags.map((t) => (
                <span className="chip" key={t}>
                  {t}
                  <button
                    type="button"
                    aria-label={`Remove ${t}`}
                    onClick={() => saveTags(tags.filter((x) => x !== t))}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                list="all-tags"
                value={draft}
                placeholder="Add tag…"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addDraft();
                  }
                }}
                onBlur={addDraft}
              />
              <datalist id="all-tags">
                {allTags.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            </span>
          </div>
        </div>
      </details>
    </div>
  );
}

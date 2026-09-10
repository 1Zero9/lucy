"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Note, NoteVersion } from "@/lib/db/notes";

type SaveState = "saved" | "dirty" | "saving" | "error";

const DEBOUNCE_MS = 1200;

async function apiJson<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) }
  });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? "Request failed.");
  return body as T;
}

function ago(iso: string): string {
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export function NoteEditor({
  note,
  initialVersions
}: {
  note: Note;
  initialVersions: NoteVersion[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [text, setText] = useState(note.content_text);
  const [state, setState] = useState<SaveState>("saved");
  const [versions, setVersions] = useState<NoteVersion[]>(initialVersions);
  const [showVersions, setShowVersions] = useState(false);
  const [preview, setPreview] = useState<NoteVersion | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const pending = useRef(false);
  // Latest edited values, readable from async callbacks without stale closures.
  const latest = useRef({ title: note.title, text: note.content_text });
  const savedRef = useRef({ title: note.title, text: note.content_text });

  const refreshVersions = useCallback(async () => {
    try {
      const { versions: v } = await apiJson<{ versions: NoteVersion[] }>(
        `/api/notes/${note.id}/versions`,
        { method: "GET" }
      );
      setVersions(v);
    } catch {
      /* non-critical */
    }
  }, [note.id]);

  const save = useCallback(
    async (source: "autosave" | "manual") => {
      if (inFlight.current) {
        pending.current = true;
        return;
      }
      const snapshot = { ...latest.current };
      if (
        source === "autosave" &&
        snapshot.title === savedRef.current.title &&
        snapshot.text === savedRef.current.text
      ) {
        setState("saved");
        return;
      }
      inFlight.current = true;
      setState("saving");
      try {
        await apiJson<{ note: Note }>(`/api/notes/${note.id}`, {
          method: "PATCH",
          body: JSON.stringify({ ...snapshot, source })
        });
        savedRef.current = snapshot;
        // Only claim "Saved" if nothing changed while the request was in flight.
        const stillCurrent =
          latest.current.title === snapshot.title && latest.current.text === snapshot.text;
        setState(stillCurrent ? "saved" : "dirty");
        void refreshVersions();
      } catch {
        setState("error");
      } finally {
        inFlight.current = false;
        if (pending.current) {
          pending.current = false;
          void save("autosave");
        }
      }
    },
    [note.id, refreshVersions]
  );

  function onEdit(next: { title?: string; text?: string }) {
    if (next.title !== undefined) {
      setTitle(next.title);
      latest.current.title = next.title;
    }
    if (next.text !== undefined) {
      setText(next.text);
      latest.current.text = next.text;
    }
    setState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save("autosave"), DEBOUNCE_MS);
  }

  // Flush a pending edit when the tab is hidden or the page is unloading.
  useEffect(() => {
    function flush() {
      if (
        latest.current.title === savedRef.current.title &&
        latest.current.text === savedRef.current.text
      ) {
        return;
      }
      fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...latest.current, source: "autosave" }),
        keepalive: true
      }).catch(() => {});
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [note.id]);

  async function del() {
    try {
      await apiJson(`/api/notes/${note.id}`, { method: "DELETE" });
      router.push("/notes");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  async function restore(version: number) {
    try {
      const { note: updated } = await apiJson<{ note: Note }>(
        `/api/notes/${note.id}/versions/${version}/restore`,
        { method: "POST" }
      );
      setTitle(updated.title);
      setText(updated.content_text);
      latest.current = { title: updated.title, text: updated.content_text };
      savedRef.current = { ...latest.current };
      setState("saved");
      setPreview(null);
      void refreshVersions();
    } catch {
      setState("error");
    }
  }

  const status: Record<SaveState, string> = {
    saved: "Saved",
    dirty: "Unsaved changes",
    saving: "Saving…",
    error: "Couldn’t save"
  };

  return (
    <div className="note-editor">
      <div className="topbar">
        <input
          className="note-title"
          aria-label="Note title"
          value={title}
          onChange={(e) => onEdit({ title: e.target.value })}
          placeholder="Untitled note"
        />
        <div className="note-actions">
          <span className={`save-state save-${state}`} role="status" aria-live="polite">
            {status[state]}
            {state === "error" ? (
              <>
                {" — "}
                <button className="linkish" type="button" onClick={() => void save("manual")}>
                  Retry
                </button>
              </>
            ) : null}
          </span>
          <button
            className="linkish"
            type="button"
            onClick={() => setShowVersions((v) => !v)}
          >
            History ({versions.length})
          </button>
          <button className="linkish danger" type="button" onClick={del}>
            Delete
          </button>
        </div>
      </div>

      <textarea
        className="note-body"
        aria-label="Note"
        value={text}
        onChange={(e) => onEdit({ text: e.target.value })}
        placeholder="Start writing…"
      />

      {showVersions ? (
        <aside className="versions">
          <div className="section-head">
            <h2>History</h2>
            <button className="linkish" type="button" onClick={() => void save("manual")}>
              Snapshot now
            </button>
          </div>
          <ul className="version-list">
            {versions.map((v) => (
              <li key={v.id}>
                <div>
                  <strong>v{v.version}</strong> · {v.source} · {ago(v.created_at)}
                </div>
                <div className="row">
                  <button
                    className="linkish"
                    type="button"
                    onClick={() => setPreview(preview?.id === v.id ? null : v)}
                  >
                    {preview?.id === v.id ? "Hide" : "Preview"}
                  </button>
                  {v.version !== versions[0]?.version ? (
                    <button className="linkish" type="button" onClick={() => restore(v.version)}>
                      Restore this version
                    </button>
                  ) : null}
                </div>
                {preview?.id === v.id ? (
                  <pre className="version-preview">{v.content_text || "(empty)"}</pre>
                ) : null}
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}

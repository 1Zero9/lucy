"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Note, NoteVersion } from "@/lib/db/notes";
import { Markdown } from "@/components/markdown";

type SaveState = "saved" | "dirty" | "saving" | "error";
type Mode = "write" | "split" | "preview";

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
  const [mode, setMode] = useState<Mode>("write");
  const [versions, setVersions] = useState<NoteVersion[]>(initialVersions);
  const [showVersions, setShowVersions] = useState(false);
  const [preview, setPreview] = useState<NoteVersion | null>(null);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const pending = useRef(false);
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

  const scheduleSave = useCallback(() => {
    setState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save("autosave"), DEBOUNCE_MS);
  }, [save]);

  function onTitle(v: string) {
    setTitle(v);
    latest.current.title = v;
    scheduleSave();
  }
  function onText(v: string) {
    setText(v);
    latest.current.text = v;
    scheduleSave();
  }

  /** Toolbar: wrap the current selection, or insert at the caret. */
  function surround(before: string, after = before, placeholder = "text") {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const sel = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    onText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = s + before.length;
      el.selectionEnd = s + before.length + sel.length;
    });
  }

  function linePrefix(prefix: string) {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, value } = el;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = s + prefix.length;
    });
  }

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
          onChange={(e) => onTitle(e.target.value)}
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
          <button className="linkish" type="button" onClick={() => setShowVersions((v) => !v)}>
            History ({versions.length})
          </button>
          <button className="linkish danger" type="button" onClick={del}>
            Delete
          </button>
        </div>
      </div>

      <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" onClick={() => surround("**")} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => surround("*")} title="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={() => surround("`", "`", "code")} title="Inline code">
          {"</>"}
        </button>
        <span className="sep" />
        <button type="button" onClick={() => linePrefix("## ")} title="Heading">
          H
        </button>
        <button type="button" onClick={() => linePrefix("- ")} title="Bullet list">
          •
        </button>
        <button type="button" onClick={() => linePrefix("1. ")} title="Numbered list">
          1.
        </button>
        <button type="button" onClick={() => linePrefix("- [ ] ")} title="Checklist">
          ☑
        </button>
        <button type="button" onClick={() => linePrefix("> ")} title="Quote">
          ❝
        </button>
        <button type="button" onClick={() => surround("[", "](https://)", "link")} title="Link">
          🔗
        </button>
        <span className="sep" />
        <span className="view-toggle" role="group" aria-label="View">
          {(["write", "split", "preview"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              className={mode === m ? "on" : ""}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
            >
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </span>
      </div>

      <div className={`editor-panes mode-${mode}`}>
        {mode !== "preview" ? (
          <textarea
            ref={bodyRef}
            className="note-body"
            aria-label="Note"
            value={text}
            onChange={(e) => onText(e.target.value)}
            placeholder="Start writing… Markdown supported."
          />
        ) : null}
        {mode !== "write" ? (
          <div className="note-preview">
            <Markdown source={text} />
          </div>
        ) : null}
      </div>

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

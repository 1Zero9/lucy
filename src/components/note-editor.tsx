"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Note, NoteVersion } from "@/lib/db/notes";
import { Markdown } from "@/components/markdown";
import { useSession } from "@/lib/auth/client";
import {
  dismissConflict,
  flush,
  getSyncState,
  initSync,
  queueNoteUpdate,
  readCachedNoteFor,
  seedNoteCache,
  subscribeSync,
  type SyncState
} from "@/lib/offline/client";

type Mode = "write" | "split" | "preview";
const DEBOUNCE_MS = 1000;

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
  const { data: session } = useSession();
  const accountId = session?.user?.id ?? null;
  const [title, setTitle] = useState(note.title);
  const [text, setText] = useState(note.content_text);
  const [mode, setMode] = useState<Mode>("write");
  const [versions, setVersions] = useState<NoteVersion[]>(initialVersions);
  const [showVersions, setShowVersions] = useState(false);
  const [preview, setPreview] = useState<NoteVersion | null>(null);
  const [sync, setSync] = useState<SyncState>(getSyncState());
  const [dirty, setDirty] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title: note.title, text: note.content_text });
  const base = useRef(note.updated_at);

  // Seed / adopt the local cache and track sync status. Guarded on knowing
  // the signed-in account — the offline layer refuses to touch its cache or
  // queue for an unknown account (UPGRADE.md §7: shared-device isolation).
  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    // Idempotent — safe even if OfflineBar's own initSync() hasn't run yet
    // (component mount order isn't guaranteed).
    initSync(accountId);
    void seedNoteCache(note).then(() => readCachedNoteFor(note.id, accountId)).then((c) => {
      if (cancelled || !c) return;
      base.current = c.serverUpdatedAt;
      if (c.dirty) {
        setTitle(c.title);
        setText(c.text);
        latest.current = { title: c.title, text: c.text };
        setDirty(true);
      }
    });
    const unsub = subscribeSync((s) => {
      setSync(s);
      if (!s.syncing && s.pending === 0) {
        setDirty(false);
        void readCachedNoteFor(note.id, accountId).then((c) => {
          if (c) base.current = c.serverUpdatedAt;
        });
        void refreshVersions();
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id, accountId]);

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

  const commit = useCallback(() => {
    setDirty(false);
    void queueNoteUpdate(note.id, { ...latest.current }, base.current);
  }, [note.id]);

  const onEdit = useCallback(
    (next: { title?: string; text?: string }) => {
      if (next.title !== undefined) {
        setTitle(next.title);
        latest.current.title = next.title;
      }
      if (next.text !== undefined) {
        setText(next.text);
        latest.current.text = next.text;
      }
      setDirty(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(commit, DEBOUNCE_MS);
    },
    [commit]
  );

  useEffect(() => {
    function onHide() {
      if (dirty) {
        if (timer.current) clearTimeout(timer.current);
        commit();
      }
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") onHide();
    }
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [dirty, commit]);

  // --- toolbar helpers ---
  function surround(before: string, after = before, placeholder = "text") {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const sel = value.slice(s, e) || placeholder;
    onEdit({ text: value.slice(0, s) + before + sel + after + value.slice(e) });
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
    onEdit({ text: value.slice(0, lineStart) + prefix + value.slice(lineStart) });
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = s + prefix.length;
    });
  }

  async function del() {
    try {
      await apiJson(`/api/notes/${note.id}`, { method: "DELETE" });
      router.push("/notes");
      router.refresh();
    } catch {
      /* surfaced by sync bar / retry */
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
      base.current = updated.updated_at;
      await seedNoteCache(updated);
      setDirty(false);
      setPreview(null);
      void refreshVersions();
    } catch {
      /* ignore */
    }
  }

  const hasConflict = sync.conflicts.includes(note.id);

  function statusLabel(): { text: string; kind: string } {
    if (sync.error) return { text: sync.error, kind: "error" };
    if (!sync.online && (dirty || sync.pending > 0)) {
      return { text: "Offline — saved locally", kind: "offline" };
    }
    if (sync.syncing) return { text: "Saving…", kind: "saving" };
    if (dirty || sync.pending > 0) return { text: "Saving…", kind: "saving" };
    return { text: "Saved", kind: "saved" };
  }
  const status = statusLabel();

  return (
    <div className="note-editor">
      {hasConflict ? (
        <div className="conflict-banner" role="alert">
          This note was changed on another device. Your offline version was saved to{" "}
          <button className="linkish" type="button" onClick={() => setShowVersions(true)}>
            History
          </button>
          .
          <button className="linkish" type="button" onClick={() => dismissConflict(note.id)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="topbar">
        <input
          className="note-title"
          aria-label="Note title"
          value={title}
          onChange={(e) => onEdit({ title: e.target.value })}
          placeholder="Untitled note"
        />
        <div className="note-actions">
          <span className={`save-state save-${status.kind}`} role="status" aria-live="polite">
            {status.text}
            {status.kind === "error" ? (
              <>
                {" — "}
                <button className="linkish" type="button" onClick={() => void flush()}>
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
            onChange={(e) => onEdit({ text: e.target.value })}
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
                  <button className="linkish" type="button" onClick={() => restore(v.version)}>
                    Restore this version
                  </button>
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

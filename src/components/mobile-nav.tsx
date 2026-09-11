"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CameraIcon,
  DrawingIcon,
  ModulesIcon,
  NotesIcon,
  PlusIcon,
  RevisionsIcon,
  SearchIcon,
  StickyIcon,
  TasksIcon,
  UploadIcon
} from "@/components/icons";
import type { Section } from "@/components/app-shell";
import { friendlyError } from "@/lib/errors";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Could not create that.");
  return data as T;
}

async function uploadFile(workspaceId: string, file: File): Promise<void> {
  const form = new FormData();
  form.set("file", file);
  const res = await fetch(`/api/workspaces/${workspaceId}/attachments`, { method: "POST", body: form });
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string })?.error ?? "Could not upload that file.");
  }
}

/**
 * Mobile-only bottom navigation: Notes · Subjects · + · Review · Search
 * (UPGRADE.md §6 — notes-and-study is the primary brief, so notes/subjects/
 * revision get the permanent slots; Home and Tasks move to /more). Hidden on
 * desktop via CSS. The centre "+" opens fast-capture actions; each lands the
 * user directly in something editable — one or two taps.
 */
export function MobileNav({ active, workspaceId }: { active?: Section; workspaceId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setError(null);
  }

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      close();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  }

  function newNote() {
    if (!workspaceId) return;
    run("note", async () => {
      const { note } = await postJson<{ note: { id: string } }>(`/api/workspaces/${workspaceId}/notes`, {});
      router.push(`/notes/${note.id}`);
    });
  }

  function newSticky() {
    if (!workspaceId) return;
    run("sticky", async () => {
      await postJson(`/api/workspaces/${workspaceId}/stickies`, { body: "New sticky" });
      router.push("/stickies");
      router.refresh();
    });
  }

  function newTask() {
    if (!workspaceId) return;
    run("task", async () => {
      await postJson(`/api/workspaces/${workspaceId}/tasks`, { title: "New task" });
      router.push("/tasks");
      router.refresh();
    });
  }

  function newDrawing() {
    if (!workspaceId) return;
    run("drawing", async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 800;
      const c = canvas.getContext("2d")!;
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("Could not create the canvas.");
      const form = new FormData();
      form.set("file", new File([blob], "drawing.png", { type: "image/png" }));
      form.set("width", "1280");
      form.set("height", "800");
      const res = await fetch(`/api/workspaces/${workspaceId}/drawings`, { method: "POST", body: form });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Could not create drawing.");
      router.push(`/drawings/${(data as { drawing: { id: string } }).drawing.id}`);
    });
  }

  function pickFile(fromCamera: boolean) {
    if (!workspaceId) return;
    (fromCamera ? cameraRef : fileRef).current?.click();
  }

  function onFileChosen(key: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !workspaceId) return;
    run(key, async () => {
      await uploadFile(workspaceId, file);
      router.push("/files");
      router.refresh();
    });
  }

  const actions: { key: string; label: string; icon: typeof PlusIcon; onSelect: () => void }[] = [
    { key: "note", label: "New Note", icon: NotesIcon, onSelect: newNote },
    { key: "sticky", label: "Sticky", icon: StickyIcon, onSelect: newSticky },
    { key: "task", label: "Task", icon: TasksIcon, onSelect: newTask },
    { key: "drawing", label: "Drawing", icon: DrawingIcon, onSelect: newDrawing },
    { key: "scan", label: "Scan/Photo", icon: CameraIcon, onSelect: () => pickFile(true) },
    { key: "file", label: "File", icon: UploadIcon, onSelect: () => pickFile(false) }
  ];

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        hidden
        onChange={(e) => onFileChosen("file", e)}
        aria-hidden="true"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => onFileChosen("scan", e)}
        aria-hidden="true"
      />

      <nav className="mobile-nav" aria-label="Primary">
        <Link href="/notes" aria-current={active === "notes" ? "page" : undefined}>
          <NotesIcon size={22} />
          <span>Notes</span>
        </Link>
        <Link href="/modules" aria-current={active === "modules" ? "page" : undefined}>
          <ModulesIcon size={22} />
          <span>Subjects</span>
        </Link>
        <button
          type="button"
          className="mobile-nav-fab"
          aria-label="Create"
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={!workspaceId}
          onClick={() => setOpen(true)}
        >
          <PlusIcon size={24} />
        </button>
        <Link href="/revise" aria-current={active === "study" ? "page" : undefined}>
          <RevisionsIcon size={22} />
          <span>Review</span>
        </Link>
        <Link href="/search" aria-current={active === "search" ? "page" : undefined}>
          <SearchIcon size={22} />
          <span>Search</span>
        </Link>
      </nav>

      {open ? (
        <div className="quick-sheet-backdrop" onClick={close}>
          <div
            className="quick-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Create"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="quick-sheet-handle" />
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="quick-sheet-grid">
              {actions.map(({ key, label, icon: Icon, onSelect }) => (
                <button
                  key={key}
                  type="button"
                  className="quick-sheet-item"
                  disabled={busy !== null}
                  onClick={onSelect}
                >
                  <span className="quick-sheet-icon">
                    <Icon size={22} />
                  </span>
                  {busy === key ? "Creating…" : label}
                </button>
              ))}
            </div>
            <button type="button" className="btn-plain quick-sheet-cancel" onClick={close}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useRef, useState } from "react";
import type { Attachment } from "@/lib/db/attachments";

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(type: string): boolean {
  return type.startsWith("image/") && type !== "image/svg+xml";
}

async function jsonOrThrow(res: Response) {
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? "Request failed.");
  return body;
}

export function AttachmentsManager({
  workspaceId,
  noteId,
  initialAttachments
}: {
  workspaceId: string;
  noteId?: string;
  initialAttachments: Attachment[];
}) {
  const scoped = Boolean(noteId);
  const [items, setItems] = useState<Attachment[]>(initialAttachments);
  const [deleted, setDeleted] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        if (noteId) form.set("noteId", noteId);
        const res = await fetch(`/api/workspaces/${workspaceId}/attachments`, {
          method: "POST",
          body: form
        });
        const { attachment } = (await jsonOrThrow(res)) as { attachment: Attachment };
        setItems((x) => [attachment, ...x]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(att: Attachment) {
    setError(null);
    try {
      await jsonOrThrow(await fetch(`/api/attachments/${att.id}`, { method: "DELETE" }));
      setItems((x) => x.filter((a) => a.id !== att.id));
      setDeleted((d) => [att, ...d]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function undo(att: Attachment) {
    setError(null);
    try {
      await jsonOrThrow(
        await fetch(`/api/attachments/${att.id}/restore`, { method: "POST" })
      );
      setItems((x) => [att, ...x]);
      setDeleted((d) => d.filter((a) => a.id !== att.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="attachments">
      <div className="section-head">
        <h2>{scoped ? "Attachments" : "Files"}</h2>
        <label className="btn" style={{ width: "auto", padding: "0 16px" }}>
          {busy ? "Uploading…" : "Upload"}
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            disabled={busy}
            onChange={(e) => upload(e.target.files)}
          />
        </label>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {deleted.map((d) => (
        <div className="undo-row" key={d.id}>
          <span>
            Deleted <strong>{d.filename}</strong>.
          </span>
          <button className="linkish" type="button" onClick={() => undo(d)}>
            Undo
          </button>
        </div>
      ))}

      {items.length === 0 ? (
        <div className="empty">No files yet.</div>
      ) : (
        <ul className="file-list">
          {items.map((a) => (
            <li key={a.id}>
              {isImage(a.content_type) ? (
                <a href={`/api/attachments/${a.id}/download`} target="_blank" rel="noreferrer">
                  <img
                    className="file-thumb"
                    src={`/api/attachments/${a.id}/download`}
                    alt={a.filename}
                    loading="lazy"
                  />
                </a>
              ) : (
                <span className="file-thumb file-thumb-doc" aria-hidden>
                  {a.content_type === "application/pdf" ? "PDF" : "FILE"}
                </span>
              )}
              <span className="file-meta">
                <a href={`/api/attachments/${a.id}/download`} target="_blank" rel="noreferrer">
                  {a.filename}
                </a>
                <span className="muted">
                  {humanSize(a.size_bytes)} · {new Date(a.created_at).toLocaleDateString()}
                </span>
              </span>
              <span className="row">
                {isImage(a.content_type) && scoped ? (
                  <button
                    className="linkish"
                    type="button"
                    onClick={() =>
                      navigator.clipboard
                        ?.writeText(`![${a.filename}](/api/attachments/${a.id}/download)`)
                        .catch(() => {})
                    }
                  >
                    Copy Markdown
                  </button>
                ) : null}
                <button className="linkish danger" type="button" onClick={() => remove(a)}>
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

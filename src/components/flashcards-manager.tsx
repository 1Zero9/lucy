"use client";

import { useState } from "react";
import Link from "next/link";
import type { Flashcard } from "@/lib/db/flashcards";
import type { Module } from "@/lib/db/modules";
import { friendlyError } from "@/lib/errors";
import { relativeDate } from "@/lib/format-date";
import { FlashcardsIcon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";

type NoteRef = { id: string; title: string };

async function jsonOrThrow(res: Response) {
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? "Request failed.");
  return body;
}

export function FlashcardsManager({
  workspaceId,
  initialCards,
  modules,
  notes = [],
  defaultModuleId,
  hideModuleGrouping = false
}: {
  workspaceId: string;
  initialCards: Flashcard[];
  modules: Module[];
  notes?: NoteRef[];
  /** Pre-select a subject on the create form — used on a module's own page
   *  so new cards are assigned there without an extra click. */
  defaultModuleId?: string;
  /** Module's own page already groups by definition — skip the per-module
   *  section headers there. */
  hideModuleGrouping?: boolean;
}) {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [deleted, setDeleted] = useState<Flashcard[]>([]);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [moduleId, setModuleId] = useState(defaultModuleId ?? "");
  const [noteId, setNoteId] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [ef, setEf] = useState("");
  const [eb, setEb] = useState("");
  const [error, setError] = useState<string | null>(null);

  const moduleName = (id: string | null) =>
    id ? (modules.find((m) => m.id === id)?.name ?? "Module") : "No module";
  const noteTitle = (id: string | null) => (id ? notes.find((n) => n.id === id)?.title : undefined);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setError(null);
    try {
      const { card } = (await jsonOrThrow(
        await fetch(`/api/workspaces/${workspaceId}/flashcards`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            front: front.trim(),
            back: back.trim(),
            moduleId: moduleId || null,
            noteId: noteId || null
          })
        })
      )) as { card: Flashcard };
      setCards((c) => [...c, card]);
      setFront("");
      setBack("");
      setNoteId("");
    } catch (e2) {
      setError(friendlyError(e2));
    }
  }

  async function saveEdit(id: string) {
    if (!ef.trim() || !eb.trim()) return;
    setError(null);
    try {
      const { card } = (await jsonOrThrow(
        await fetch(`/api/flashcards/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ front: ef.trim(), back: eb.trim() })
        })
      )) as { card: Flashcard };
      setCards((c) => c.map((x) => (x.id === id ? card : x)));
      setEditing(null);
    } catch (e2) {
      setError(friendlyError(e2));
    }
  }

  async function remove(card: Flashcard) {
    setError(null);
    try {
      await jsonOrThrow(await fetch(`/api/flashcards/${card.id}`, { method: "DELETE" }));
      setCards((c) => c.filter((x) => x.id !== card.id));
      setDeleted((d) => [card, ...d]);
    } catch (e2) {
      setError(friendlyError(e2));
    }
  }

  async function undo(card: Flashcard) {
    setError(null);
    try {
      await jsonOrThrow(await fetch(`/api/flashcards/${card.id}/restore`, { method: "POST" }));
      setCards((c) => [...c, card]);
      setDeleted((d) => d.filter((x) => x.id !== card.id));
    } catch (e2) {
      setError(friendlyError(e2));
    }
  }

  const groups = new Map<string, Flashcard[]>();
  for (const c of cards) {
    const k = c.module_id ?? "";
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }

  return (
    <div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="inline-form" onSubmit={add} style={{ marginBottom: 18, alignItems: "start" }}>
        <input aria-label="Front" placeholder="Front (prompt)" value={front} onChange={(e) => setFront(e.target.value)} />
        <input aria-label="Back" placeholder="Back (answer)" value={back} onChange={(e) => setBack(e.target.value)} />
        <select aria-label="Subject" value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
          <option value="">No subject</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {notes.length > 0 ? (
          <select aria-label="From note" value={noteId} onChange={(e) => setNoteId(e.target.value)}>
            <option value="">Not from a note</option>
            {notes.map((n) => (
              <option key={n.id} value={n.id}>
                From: {n.title}
              </option>
            ))}
          </select>
        ) : null}
        <button className="btn" type="submit" disabled={!front.trim() || !back.trim()}>
          Add flashcard
        </button>
      </form>

      {deleted.map((d) => (
        <div className="undo-row" key={d.id}>
          <span>Card deleted.</span>
          <button className="linkish" type="button" onClick={() => undo(d)}>
            Undo
          </button>
        </div>
      ))}

      {cards.length === 0 ? (
        <EmptyState
          icon={<FlashcardsIcon size={22} />}
          title="No flashcards yet"
          body="Add a front and back above — they'll show up in Revision when they're due."
        />
      ) : (
        (hideModuleGrouping ? ([["__all__", cards]] as [string, Flashcard[]][]) : [...groups.entries()]).map(
          ([mid, list]) => (
          <section key={mid || "none"} className="task-group">
            {hideModuleGrouping ? null : (
              <div className="section-head">
                <h2>
                  {moduleName(mid || null)} <span className="muted">({list.length})</span>
                </h2>
              </div>
            )}
            <ul className="note-list">
              {list.map((c) => (
                <li key={c.id}>
                  <div style={{ padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", display: "grid", gap: 6 }}>
                    {editing === c.id ? (
                      <div className="field">
                        <input value={ef} onChange={(e) => setEf(e.target.value)} aria-label="Front" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "6px 8px" }} />
                        <input value={eb} onChange={(e) => setEb(e.target.value)} aria-label="Back" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "6px 8px" }} />
                        <div className="row">
                          <button className="btn" type="button" style={{ width: "auto", padding: "0 16px" }} onClick={() => saveEdit(c.id)}>
                            Save
                          </button>
                          <button className="linkish" type="button" onClick={() => setEditing(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <strong>{c.front}</strong>
                        <span className="muted">{c.back}</span>
                        <span className="muted" style={{ fontSize: 12 }}>
                          {c.due_at ? `Due ${relativeDate(c.due_at)}` : "New"} · {c.reps} review
                          {c.reps === 1 ? "" : "s"}
                        </span>
                        {c.note_id && noteTitle(c.note_id) ? (
                          <Link className="linkish" href={`/notes/${c.note_id}`} style={{ fontSize: 12 }}>
                            Open source note: {noteTitle(c.note_id)}
                          </Link>
                        ) : null}
                        <div className="row">
                          <button
                            className="linkish"
                            type="button"
                            onClick={() => {
                              setEditing(c.id);
                              setEf(c.front);
                              setEb(c.back);
                            }}
                          >
                            Edit
                          </button>
                          <button className="linkish danger" type="button" onClick={() => remove(c)}>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

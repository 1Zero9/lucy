"use client";

import { useState } from "react";
import Link from "next/link";
import type { Flashcard } from "@/lib/db/flashcards";
import type { Grade } from "@/lib/srs";

const GRADES: { grade: Grade; label: string }[] = [
  { grade: "again", label: "Again" },
  { grade: "hard", label: "Hard" },
  { grade: "good", label: "Good" },
  { grade: "easy", label: "Easy" }
];

export function RevisionSession({ initialQueue }: { initialQueue: Flashcard[] }) {
  const [queue, setQueue] = useState<Flashcard[]>(initialQueue);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const card = queue[i];

  async function grade(g: Grade) {
    if (!card || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/flashcards/${card.id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grade: g })
      });
      const body: unknown = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string })?.error ?? "Could not save review.");
      const updated = (body as { card: Flashcard }).card;
      // "Again" keeps the card in play — requeue it at the end.
      setReviewed((n) => n + 1);
      setRevealed(false);
      setQueue((q) => (g === "again" ? [...q, updated] : q));
      setI((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!card) {
    return (
      <div className="empty" style={{ padding: 40 }}>
        <p>
          {reviewed === 0
            ? "Nothing is due right now."
            : `Done — you reviewed ${reviewed} card${reviewed === 1 ? "" : "s"}.`}
        </p>
        <Link className="linkish" href="/flashcards">
          Back to flashcards
        </Link>
      </div>
    );
  }

  return (
    <div className="revise">
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="muted" style={{ textAlign: "center" }}>
        {queue.length - i} to go · {reviewed} done
      </p>

      <div className="revise-card">
        <div className="revise-face">{card.front}</div>
        {revealed ? (
          <>
            <hr />
            <div className="revise-face back">{card.back}</div>
          </>
        ) : null}
      </div>

      {revealed ? (
        <div className="revise-grades">
          {GRADES.map((g) => (
            <button key={g.grade} className="btn-plain" type="button" disabled={busy} onClick={() => grade(g.grade)}>
              {g.label}
            </button>
          ))}
        </div>
      ) : (
        <button className="btn" type="button" onClick={() => setRevealed(true)} style={{ maxWidth: 240, margin: "0 auto" }}>
          Show answer
        </button>
      )}
    </div>
  );
}

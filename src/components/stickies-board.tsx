"use client";

import { useState } from "react";
import type { Sticky } from "@/lib/db/stickies";

const PALETTE = ["#FEF9C3", "#DCFCE7", "#DBEAFE", "#FEE2E2", "#F3E8FF", "#FFEDD5"];

async function jsonOrThrow(res: Response) {
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? "Request failed.");
  return body;
}

export function StickiesBoard({
  workspaceId,
  initialStickies
}: {
  workspaceId: string;
  initialStickies: Sticky[];
}) {
  const [stickies, setStickies] = useState<Sticky[]>(initialStickies);
  const [deleted, setDeleted] = useState<Sticky[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setError(null);
    try {
      const { sticky } = (await jsonOrThrow(
        await fetch(`/api/workspaces/${workspaceId}/stickies`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ body })
        })
      )) as { sticky: Sticky };
      setStickies((s) => [sticky, ...s]);
      setDraft("");
    } catch (e2) {
      setError((e2 as Error).message);
    }
  }

  async function patch(id: string, fields: Record<string, unknown>) {
    setError(null);
    try {
      const { sticky } = (await jsonOrThrow(
        await fetch(`/api/stickies/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(fields)
        })
      )) as { sticky: Sticky };
      setStickies((s) => s.map((x) => (x.id === id ? sticky : x)));
    } catch (e2) {
      setError((e2 as Error).message);
    }
  }

  async function remove(st: Sticky) {
    setError(null);
    try {
      await jsonOrThrow(await fetch(`/api/stickies/${st.id}`, { method: "DELETE" }));
      setStickies((s) => s.filter((x) => x.id !== st.id));
      setDeleted((d) => [st, ...d]);
    } catch (e2) {
      setError((e2 as Error).message);
    }
  }

  async function undo(st: Sticky) {
    setError(null);
    try {
      await jsonOrThrow(await fetch(`/api/stickies/${st.id}/restore`, { method: "POST" }));
      setStickies((s) => [st, ...s]);
      setDeleted((d) => d.filter((x) => x.id !== st.id));
    } catch (e2) {
      setError((e2 as Error).message);
    }
  }

  return (
    <div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="inline-form" onSubmit={add} style={{ marginBottom: 16 }}>
        <input
          aria-label="New sticky"
          placeholder="Jot something down…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn" type="submit" disabled={!draft.trim()}>
          Add
        </button>
      </form>

      {deleted.map((d) => (
        <div className="undo-row" key={d.id}>
          <span>Sticky deleted.</span>
          <button className="linkish" type="button" onClick={() => undo(d)}>
            Undo
          </button>
        </div>
      ))}

      {stickies.length === 0 ? (
        <div className="empty">No stickies. Add one above.</div>
      ) : (
        <div className="sticky-grid">
          {stickies.map((st) => (
            <article
              className="sticky"
              key={st.id}
              style={{ background: st.colour ?? PALETTE[0] }}
            >
              <textarea
                aria-label="Sticky text"
                defaultValue={st.body}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== st.body) patch(st.id, { body: v });
                }}
              />
              <div className="sticky-foot">
                <span className="swatches">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`swatch${st.colour === c ? " sel" : ""}`}
                      style={{ background: c }}
                      aria-label={`Colour ${c}`}
                      onClick={() => patch(st.id, { colour: c })}
                    />
                  ))}
                </span>
                <button className="linkish danger" type="button" onClick={() => remove(st)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

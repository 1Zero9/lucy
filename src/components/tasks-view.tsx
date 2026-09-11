"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/lib/db/tasks";
import { dueBucket, DUE_BUCKET_LABELS, DUE_BUCKET_ORDER, type DueBucket } from "@/lib/due";
import { friendlyError } from "@/lib/errors";
import { TasksIcon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";

async function jsonOrThrow(res: Response) {
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? "Request failed.");
  return body;
}

function dateValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
function datetimeValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

export function TasksView({
  workspaceId,
  initialTasks
}: {
  workspaceId: string;
  initialTasks: Task[];
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [deleted, setDeleted] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = useMemo(() => tasks.filter((t) => t.status === "open"), [tasks]);
  const done = useMemo(() => tasks.filter((t) => t.status === "done"), [tasks]);
  const groups = useMemo(() => {
    const m = new Map<DueBucket, Task[]>();
    for (const t of open) {
      const b = dueBucket(t.due_at);
      m.set(b, [...(m.get(b) ?? []), t]);
    }
    return m;
  }, [open]);

  function replace(next: Task) {
    setTasks((ts) => ts.map((t) => (t.id === next.id ? next : t)));
  }
  function guard<T>(p: Promise<T>) {
    p.catch((e) => setError(friendlyError(e)));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    try {
      const { task } = (await jsonOrThrow(
        await fetch(`/api/workspaces/${workspaceId}/tasks`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: title.trim(), dueAt: due || null })
        })
      )) as { task: Task };
      setTasks((ts) => [...ts, task]);
      setTitle("");
      setDue("");
    } catch (e2) {
      setError(friendlyError(e2));
    }
  }

  async function patch(id: string, fields: Record<string, unknown>) {
    setError(null);
    const { task } = (await jsonOrThrow(
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(fields)
      })
    )) as { task: Task };
    replace(task);
  }

  async function remove(t: Task) {
    setError(null);
    try {
      await jsonOrThrow(await fetch(`/api/tasks/${t.id}`, { method: "DELETE" }));
      setTasks((ts) => ts.filter((x) => x.id !== t.id));
      setDeleted((d) => [t, ...d]);
    } catch (e2) {
      setError(friendlyError(e2));
    }
  }
  async function undo(t: Task) {
    setError(null);
    try {
      await jsonOrThrow(await fetch(`/api/tasks/${t.id}/restore`, { method: "POST" }));
      setTasks((ts) => [...ts, t]);
      setDeleted((d) => d.filter((x) => x.id !== t.id));
    } catch (e2) {
      setError(friendlyError(e2));
    }
  }

  function Row({ t }: { t: Task }) {
    const isOpen = expanded === t.id;
    return (
      <li className={`task${t.status === "done" ? " is-done" : ""}`}>
        <div className="task-main">
          <input
            type="checkbox"
            aria-label={t.status === "done" ? "Mark as not done" : "Mark as done"}
            checked={t.status === "done"}
            onChange={() => guard(patch(t.id, { status: t.status === "done" ? "open" : "done" }))}
          />
          <input
            className="task-title"
            aria-label="Task title"
            defaultValue={t.title}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== t.title) guard(patch(t.id, { title: v }));
            }}
          />
          <input
            type="date"
            aria-label="Due date"
            value={dateValue(t.due_at)}
            onChange={(e) => guard(patch(t.id, { dueAt: e.target.value || null }))}
          />
          <button
            className="linkish"
            type="button"
            aria-expanded={isOpen}
            onClick={() => setExpanded(isOpen ? null : t.id)}
          >
            {isOpen ? "Less" : "More"}
          </button>
          <button className="linkish danger" type="button" onClick={() => remove(t)}>
            Delete
          </button>
        </div>
        {isOpen ? (
          <div className="task-detail">
            <label>
              <span className="muted">Reminder</span>
              <input
                type="datetime-local"
                value={datetimeValue(t.remind_at)}
                onChange={(e) => guard(patch(t.id, { remindAt: e.target.value || null }))}
              />
            </label>
            <label className="grow">
              <span className="muted">Notes</span>
              <input
                defaultValue={t.detail ?? ""}
                placeholder="Extra detail…"
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v !== (t.detail ?? "")) guard(patch(t.id, { detail: v || null }));
                }}
              />
            </label>
          </div>
        ) : null}
      </li>
    );
  }

  return (
    <div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="inline-form" onSubmit={add} style={{ marginBottom: 18 }}>
        <input
          aria-label="New task"
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input type="date" aria-label="Due date" value={due} onChange={(e) => setDue(e.target.value)} />
        <button className="btn" type="submit" disabled={!title.trim()}>
          Add task
        </button>
      </form>

      {deleted.map((d) => (
        <div className="undo-row" key={d.id}>
          <span>
            Deleted <strong>{d.title}</strong>.
          </span>
          <button className="linkish" type="button" onClick={() => undo(d)}>
            Undo
          </button>
        </div>
      ))}

      {open.length === 0 ? (
        <EmptyState
          icon={<TasksIcon size={22} />}
          title="Nothing open"
          body="Deadlines and to-dos you add above will show up here, grouped by how soon they're due."
        />
      ) : (
        DUE_BUCKET_ORDER.map((b) => {
          const list = groups.get(b);
          if (!list || list.length === 0) return null;
          return (
            <section key={b} className="task-group">
              <div className="section-head">
                <h2 className={b === "overdue" ? "overdue" : undefined}>
                  {DUE_BUCKET_LABELS[b]} <span className="muted">({list.length})</span>
                </h2>
              </div>
              <ul className="task-list">
                {list.map((t) => (
                  <Row key={t.id} t={t} />
                ))}
              </ul>
            </section>
          );
        })
      )}

      {done.length > 0 ? (
        <details className="done-block">
          <summary>Done ({done.length})</summary>
          <ul className="task-list">
            {done.map((t) => (
              <Row key={t.id} t={t} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

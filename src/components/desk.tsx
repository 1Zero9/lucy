import Link from "next/link";
import type { Module } from "@/lib/db/modules";
import type { Note } from "@/lib/db/notes";
import type { Task } from "@/lib/db/tasks";
import { dueBucket } from "@/lib/due";
import { relativeDate } from "@/lib/format-date";
import { chooseDeskDominantItem, chooseDeskSecondaryTask } from "@/lib/desk";

function excerpt(text: string, length = 280): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length).trimEnd()}…` : clean;
}

function dueLabel(task: Task): string {
  const bucket = dueBucket(task.due_at);
  if (bucket === "overdue") return "Overdue";
  if (bucket === "today") return "Due today";
  if (bucket === "soon") {
    return `Due ${new Date(task.due_at as string).toLocaleDateString(undefined, { weekday: "long" })}`;
  }
  return `Due ${relativeDate(task.due_at as string)}`;
}

export function Desk({
  notes,
  tasks,
  modules
}: {
  notes: Note[];
  tasks: Task[];
  modules: Module[];
}) {
  const dominant = chooseDeskDominantItem(notes, tasks);
  const secondary = dominant?.kind === "note" ? chooseDeskSecondaryTask(tasks) : null;
  const moduleById = new Map(modules.map((module) => [module.id, module]));

  if (!dominant) {
    return (
      <section className="desk desk-empty" aria-label="Desk">
        <div className="desk-empty-copy">
          <p>Your desk is clear.</p>
        </div>
      </section>
    );
  }

  if (dominant.kind === "task") {
    return (
      <section className="desk" aria-label="Desk">
        <Link href="/tasks" className="desk-primary desk-primary-task">
          <span className="desk-kicker">{dueLabel(dominant.task)}</span>
          <h2>{dominant.task.title}</h2>
          {dominant.task.detail ? <p>{excerpt(dominant.task.detail, 180)}</p> : null}
          <span className="desk-open">Open tasks</span>
        </Link>
      </section>
    );
  }

  const subject = dominant.note.module_id ? moduleById.get(dominant.note.module_id) : undefined;
  const secondarySubject = secondary?.module_id ? moduleById.get(secondary.module_id) : undefined;
  return (
    <section className="desk" aria-label="Desk">
      <Link
        href={`/notes/${dominant.note.id}`}
        className="desk-primary desk-primary-note"
        style={subject ? ({ "--subject-colour": subject.colour } as React.CSSProperties) : undefined}
      >
        {subject ? (
          <span className="desk-subject">
            <i aria-hidden="true" />
            {subject.name}
          </span>
        ) : null}
        <span className="desk-kicker">{dominant.reason === "pinned" ? "Pinned page" : "Continue"}</span>
        <h2>{dominant.note.title}</h2>
        <p>{excerpt(dominant.note.content_text)}</p>
        <span className="desk-open">Open page</span>
      </Link>

      {secondary ? (
        <aside className="desk-secondary" aria-label="Coming up">
          <span>Coming up</span>
          {secondarySubject ? <small className="desk-secondary-subject">{secondarySubject.name}</small> : null}
          <Link href="/tasks">{secondary.title}</Link>
          <small>{dueLabel(secondary)}</small>
        </aside>
      ) : null}
    </section>
  );
}

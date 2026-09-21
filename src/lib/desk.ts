import type { Note } from "@/lib/db/notes";
import type { Task } from "@/lib/db/tasks";
import { dueBucket } from "@/lib/due";

/**
 * A note earns a place on the Desk only when it contains at least 80 visible
 * characters after normalising whitespace. This avoids elevating blank pages
 * and placeholder fragments without introducing ranking or new stored data.
 */
export const MEANINGFUL_NOTE_MINIMUM_CHARACTERS = 80;

export function hasMeaningfulContent(note: Pick<Note, "content_text">): boolean {
  return note.content_text.replace(/\s+/g, " ").trim().length >= MEANINGFUL_NOTE_MINIMUM_CHARACTERS;
}

export type DeskDominantItem =
  | { kind: "note"; note: Note; reason: "pinned" | "recent-work" }
  | { kind: "task"; task: Task }
  | null;

function newestFirst<T extends { updated_at: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

function urgentFirst(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const rank = (task: Task) => (dueBucket(task.due_at) === "overdue" ? 0 : 1);
    const bucketDifference = rank(a) - rank(b);
    if (bucketDifference !== 0) return bucketDifference;
    return (a.due_at ?? "").localeCompare(b.due_at ?? "");
  });
}

export function chooseDeskDominantItem(notes: Note[], tasks: Task[]): DeskDominantItem {
  const pinned = newestFirst(notes.filter((note) => note.is_pinned === 1))[0];
  if (pinned) return { kind: "note", note: pinned, reason: "pinned" };

  const urgent = urgentFirst(
    tasks.filter((task) => task.status === "open" && ["overdue", "today"].includes(dueBucket(task.due_at)))
  )[0];
  if (urgent) return { kind: "task", task: urgent };

  const recentWork = newestFirst(notes.filter(hasMeaningfulContent))[0];
  if (recentWork) return { kind: "note", note: recentWork, reason: "recent-work" };

  return null;
}

/** The only Desk aside: the nearest due task in the next seven calendar days. */
export function chooseDeskSecondaryTask(tasks: Task[]): Task | null {
  return [...tasks]
    .filter((task) => task.status === "open" && dueBucket(task.due_at) === "soon")
    .sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""))[0] ?? null;
}

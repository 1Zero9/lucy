export type DueBucket = "overdue" | "today" | "soon" | "later" | "none";

export const DUE_BUCKET_LABELS: Record<DueBucket, string> = {
  overdue: "Overdue",
  today: "Today",
  soon: "Next 7 days",
  later: "Later",
  none: "No date"
};

export const DUE_BUCKET_ORDER: DueBucket[] = ["overdue", "today", "soon", "later", "none"];

/**
 * Classify a due date relative to `now` (defaults to the current time).
 * Comparisons are calendar-day based in the runtime's local time.
 */
export function dueBucket(dueAt: string | null | undefined, now: Date = new Date()): DueBucket {
  if (!dueAt) return "none";
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return "none";

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;
  const in7Days = startOfToday + 7 * 24 * 60 * 60 * 1000;
  const t = due.getTime();

  if (t < startOfToday) return "overdue";
  if (t < startOfTomorrow) return "today";
  if (t < in7Days) return "soon";
  return "later";
}

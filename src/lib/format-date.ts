/**
 * Calm, scannable dates for note/file lists — "Today", "Yesterday", or
 * "11 Sep" instead of a full locale date string everywhere
 * (UPGRADE.md §5: "Consistent, readable dates such as '11 Sep' or
 * 'Yesterday'.").
 */
export function relativeDate(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

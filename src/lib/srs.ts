/**
 * Lightweight SM-2-style spaced repetition for the revision centre.
 * Pure and dependency-free.
 */
export type Grade = "again" | "hard" | "good" | "easy";

export type SrsState = {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
};

export type SrsResult = SrsState & { dueAt: string };

const MIN_EASE = 1.3;
const AGAIN_MINUTES = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

function clampEase(e: number): number {
  return Math.max(MIN_EASE, Math.round(e * 100) / 100);
}

export function schedule(state: SrsState, grade: Grade, now: Date = new Date()): SrsResult {
  let { ease, intervalDays, reps, lapses } = state;

  if (grade === "again") {
    ease = clampEase(ease - 0.2);
    lapses += 1;
    reps = 0;
    return {
      ease,
      intervalDays: 0,
      reps,
      lapses,
      dueAt: new Date(now.getTime() + AGAIN_MINUTES * 60 * 1000).toISOString()
    };
  }

  const first = reps === 0 || intervalDays === 0;
  if (grade === "hard") {
    ease = clampEase(ease - 0.15);
    intervalDays = first ? 1 : Math.max(1, Math.round(intervalDays * 1.2));
  } else if (grade === "good") {
    intervalDays = first ? 1 : Math.max(1, Math.round(intervalDays * ease));
  } else {
    // easy
    ease = clampEase(ease + 0.15);
    intervalDays = first ? 3 : Math.max(2, Math.round(intervalDays * ease * 1.3));
  }
  reps += 1;

  return {
    ease,
    intervalDays,
    reps,
    lapses,
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS).toISOString()
  };
}

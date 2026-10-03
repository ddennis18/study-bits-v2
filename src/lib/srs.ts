import type { Flashcard } from "./types";

export type ReviewRating = "again" | "hard" | "good" | "easy";
export type SrsState = Flashcard["srs"];
export type PreviewIntervals = Record<ReviewRating, string>;

const dayMilliseconds = 24 * 60 * 60 * 1000;

function examCap(examDate: string) {
  const exam = new Date(`${examDate}T23:59:59.999Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate) || Number.isNaN(exam.getTime())) {
    throw new RangeError("examDate must be an ISO date in YYYY-MM-DD format.");
  }
  exam.setUTCDate(exam.getUTCDate() - 1);
  return exam;
}

function cappedDue(now: Date, requestedIntervalDays: number, cap: Date) {
  const requestedDue = new Date(now.getTime() + requestedIntervalDays * dayMilliseconds);
  const due = requestedDue > cap ? new Date(cap) : requestedDue;
  const actualIntervalDays = Math.max(1 / 1440, (due.getTime() - now.getTime()) / dayMilliseconds);
  return { due: due.toISOString(), intervalDays: actualIntervalDays };
}

/** Apply one simplified SM-2 review and cap the next due date before the exam. */
export function reviewSrs(previous: SrsState, rating: ReviewRating, examDate: string, now = new Date()): SrsState {
  const cap = examCap(examDate);
  const previousInterval = previous.intervalDays > 0 ? previous.intervalDays : 1;
  let requestedIntervalDays: number;
  let ease = previous.ease || 2.5;
  let lapses = previous.lapses;
  let reps = previous.reps;
  let state: Flashcard["srs"]["state"] = "review";

  switch (rating) {
    case "again":
      requestedIntervalDays = 1 / 1440;
      ease -= 0.2;
      lapses += 1;
      state = "learning";
      break;
    case "hard":
      requestedIntervalDays = Math.max(1, previousInterval * 1.2);
      ease -= 0.15;
      reps += 1;
      break;
    case "good":
      requestedIntervalDays = previous.reps === 0 ? 1 : previous.reps === 1 ? 3 : previousInterval * ease;
      reps += 1;
      break;
    case "easy":
      requestedIntervalDays = previousInterval * ease * 1.3;
      ease += 0.15;
      reps += 1;
      break;
  }

  const next = cappedDue(now, requestedIntervalDays, cap);
  return {
    ...previous,
    state,
    ease: Math.max(1.3, ease),
    intervalDays: next.intervalDays,
    due: next.due,
    reps,
    lapses,
  };
}

/** Labels for the four review buttons, matching the product's compact UI copy. */
export function previewIntervals(card: Pick<Flashcard, "srs"> | SrsState): PreviewIntervals {
  void card;
  return { again: "<1m", hard: "1d", good: "3d", easy: "8d" };
}

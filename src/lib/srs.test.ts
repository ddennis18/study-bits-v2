import { describe, expect, it } from "vitest";
import { previewIntervals, reviewSrs, type SrsState } from "./srs";

const baseSrs = (overrides: Partial<SrsState> = {}): SrsState => ({
  state: "new",
  ease: 2.5,
  intervalDays: 0,
  due: "2026-10-01T12:00:00.000Z",
  reps: 0,
  lapses: 0,
  ...overrides,
});

const now = new Date("2026-10-01T12:00:00.000Z");

describe("reviewSrs", () => {
  it("applies Again with a one-minute interval and a learning state", () => {
    const next = reviewSrs(baseSrs(), "again", "2026-10-10", now);

    expect(next.state).toBe("learning");
    expect(next.due).toBe("2026-10-01T12:01:00.000Z");
    expect(next.ease).toBe(2.3);
    expect(next.lapses).toBe(1);
  });

  it("applies Hard with a 1.2 interval multiplier and ease reduction", () => {
    const next = reviewSrs(baseSrs({ intervalDays: 2, reps: 2 }), "hard", "2026-10-10", now);

    expect(next.intervalDays).toBeCloseTo(2.4);
    expect(next.ease).toBe(2.35);
    expect(next.reps).toBe(3);
  });

  it("uses Good intervals of 1 day, 3 days, then previous interval times ease", () => {
    expect(reviewSrs(baseSrs(), "good", "2026-10-20", now).intervalDays).toBe(1);
    expect(reviewSrs(baseSrs({ reps: 1, intervalDays: 1 }), "good", "2026-10-20", now).intervalDays).toBe(3);
    expect(reviewSrs(baseSrs({ reps: 2, intervalDays: 3 }), "good", "2026-10-20", now).intervalDays).toBe(7.5);
  });

  it("applies Easy with ease growth and caps the next review before the exam", () => {
    const next = reviewSrs(baseSrs({ intervalDays: 20, reps: 3 }), "easy", "2026-10-10", now);
    const cap = new Date("2026-10-09T23:59:59.999Z");

    expect(new Date(next.due).getTime()).toBe(cap.getTime());
    expect(next.intervalDays).toBeCloseTo(8.5);
    expect(next.ease).toBe(2.65);
  });
});

describe("previewIntervals", () => {
  it("returns the compact labels for all review buttons", () => {
    expect(previewIntervals(baseSrs())).toEqual({ again: "<1m", hard: "1d", good: "3d", easy: "8d" });
  });
});

import { describe, expect, it } from "vitest";
import type { Bit } from "./types";
import { scheduleBits } from "./scheduler";

const makeBit = (id: string, estMinutes: number, scheduledDate = "2026-10-01"): Bit => ({
  id,
  planId: "plan-1",
  order: Number(id.replace("bit-", "")),
  title: id,
  content: "content",
  takeaway: "takeaway",
  estMinutes,
  weight: 1,
  scheduledDate,
  status: "todo",
});

describe("scheduleBits", () => {
  it("fills each day up to dailyMinutes and preserves Bit order", () => {
    const bits = [makeBit("bit-1", 10), makeBit("bit-2", 15), makeBit("bit-3", 20), makeBit("bit-4", 5)];

    const scheduled = scheduleBits(bits, "2026-10-06", 25);

    expect(scheduled.map((bit) => bit.scheduledDate)).toEqual([
      "2026-10-01",
      "2026-10-01",
      "2026-10-02",
      "2026-10-02",
    ]);
    expect(bits[0].scheduledDate).toBe("2026-10-01");
  });

  it("does not schedule content on the two days before the exam", () => {
    const bits = [makeBit("bit-1", 30), makeBit("bit-2", 30), makeBit("bit-3", 30)];

    const scheduled = scheduleBits(bits, "2026-10-06", 30);

    expect(scheduled.map((bit) => bit.scheduledDate)).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ]);
  });

  it("throws when Bits cannot fit before the review window", () => {
    const bits = [makeBit("bit-1", 30), makeBit("bit-2", 30), makeBit("bit-3", 30), makeBit("bit-4", 30)];

    expect(() => scheduleBits(bits, "2026-10-06", 30)).toThrow("do not fit");
  });
});

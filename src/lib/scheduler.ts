import type { Bit } from "./types";

const dayMilliseconds = 24 * 60 * 60 * 1000;

function parseDate(value: string, name: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime())) {
    throw new RangeError(`${name} must be an ISO date in YYYY-MM-DD format.`);
  }
  return date;
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Schedules Bits in order, using the first Bit's date as the immutable start anchor.
 * The two calendar days immediately before the exam are reserved for review.
 */
export function scheduleBits(bits: readonly Bit[], examDate: string, dailyMinutes: number): Bit[] {
  if (!Number.isInteger(dailyMinutes) || dailyMinutes <= 0) {
    throw new RangeError("dailyMinutes must be a positive integer.");
  }
  if (bits.length === 0) return [];

  const startDate = parseDate(bits[0].scheduledDate, "The first Bit scheduledDate");
  const exam = parseDate(examDate, "examDate");
  const reviewStart = new Date(exam.getTime() - (2 * dayMilliseconds));
  if (startDate >= reviewStart) {
    throw new RangeError("The schedule must start before the two reserved review days.");
  }

  const scheduled = bits.map((bit) => ({ ...bit }));
  let currentDate = new Date(startDate);
  let minutesUsed = 0;

  for (const bit of scheduled) {
    if (!Number.isFinite(bit.estMinutes) || bit.estMinutes <= 0) {
      throw new RangeError(`Bit ${bit.id} must have a positive estMinutes value.`);
    }

    if (currentDate >= reviewStart) {
      throw new RangeError("Bits do not fit before the two reserved review days.");
    }
    if (minutesUsed > 0 && minutesUsed + bit.estMinutes > dailyMinutes) {
      currentDate = new Date(currentDate.getTime() + dayMilliseconds);
      minutesUsed = 0;
      if (currentDate >= reviewStart) {
        throw new RangeError("Bits do not fit before the two reserved review days.");
      }
    }

    bit.scheduledDate = dateOnly(currentDate);
    minutesUsed += bit.estMinutes;
  }

  return scheduled;
}

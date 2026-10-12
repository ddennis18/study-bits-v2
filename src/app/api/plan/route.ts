import { planInputSchema, planResponseSchema } from "@/lib/api-schemas";
import { generateValidated, jsonError } from "@/lib/ai";
import { ZodError } from "zod";

const systemPrompt = `PLAN: Split the study material into focused 5-20 minute units called Bits,
with one concept per Bit. Keep each Bit's content as a verbatim slice of the
source; do not rewrite it. Return JSON only, with no markdown or commentary.
The response must have exactly these two top-level properties: "title" and
"bits". The "title" property must contain a concise,
descriptive, non-empty string for the overall study plan. Each item in "bits"
must have exactly these properties:
"title" (non-empty string), "content" (non-empty string), "takeaway"
(non-empty one-sentence string), and "weight" (the number 1, 2, or 3).`;

const dayMilliseconds = 24 * 60 * 60 * 1000;

function getPlanningCapacity(examDate: string, dailyMinutes: number) {
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const exam = new Date(`${examDate}T00:00:00.000Z`);
  const reviewStart = exam.getTime() - (2 * dayMilliseconds);
  const availableStudyDays = Math.max(0, Math.floor((reviewStart - todayUtc) / dayMilliseconds));
  const estimatedBitMinutes = Math.min(20, Math.max(5, Math.round(dailyMinutes / 2)));
  const totalStudyMinutes = availableStudyDays * dailyMinutes;
  const maxBits = Math.floor(totalStudyMinutes / estimatedBitMinutes);

  return { availableStudyDays, estimatedBitMinutes, totalStudyMinutes, maxBits };
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const input = planInputSchema.parse(await request.json());
    const capacity = getPlanningCapacity(input.examDate, input.dailyMinutes);
    console.info("[api/plan] request started", {
      textLength: input.text.length,
      examDate: input.examDate,
      dailyMinutes: input.dailyMinutes,
      ...capacity,
    });
    if (capacity.maxBits < 1) {
      console.warn("[api/plan] request rejected", {
        durationMs: Date.now() - startedAt,
        error: "There is not enough time for a study Bit before the reserved review days.",
        ...capacity,
      });
      return Response.json({
        error: "There is not enough time for a study Bit before the two reserved review days.",
      }, { status: 400 });
    }
    const result = await generateValidated(`${systemPrompt}

Return an object with a "title" string and a "bits" array containing at least 1 and at most ${capacity.maxBits} Bits. Do not include dates or IDs in the Bits.
The exam date is ${input.examDate}; use it only to judge an appropriate amount of material.
The learner has ${input.dailyMinutes} minutes per day.
There are ${capacity.availableStudyDays} available study days before the two reserved review days.
The total study budget is ${capacity.totalStudyMinutes} minutes. Estimate each Bit at about
${capacity.estimatedBitMinutes} minutes, and do not exceed the maximum of ${capacity.maxBits} Bits.
Prioritize complete coverage of the most important material when the source is too large.

Source material:
${input.text}`, planResponseSchema, 1);
    console.info("[api/plan] request succeeded", {
      durationMs: Date.now() - startedAt,
      bitCount: result.bits.length,
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      console.warn("[api/plan] request rejected", {
        durationMs: Date.now() - startedAt,
        error: "Invalid plan request.",
      });
      return Response.json({ error: "Invalid plan request.", details: error.issues }, { status: 400 });
    }
    console.error("[api/plan] request failed", {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unexpected server error.",
    });
    return jsonError(error);
  }
}

import { planInputSchema, planResponseSchema } from "@/lib/api-schemas";
import { generateValidated, jsonError } from "@/lib/ai";
import { ZodError } from "zod";

const systemPrompt = `PLAN: You split study material into 'Bits': focused 5-20 minute units, each
covering ONE concept. Keep content as verbatim slices of the source, do not
rewrite it. For each Bit return title, content, a one-sentence takeaway, and
weight 1-3 for difficulty. Return JSON only.`;

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

Return an object with a "bits" array containing at most ${capacity.maxBits} Bits. Do not include dates or IDs in the Bits.
The exam date is ${input.examDate}; use it only to judge an appropriate amount of material.
The learner has ${input.dailyMinutes} minutes per day.
There are ${capacity.availableStudyDays} available study days before the two reserved review days.
The total study budget is ${capacity.totalStudyMinutes} minutes. Estimate each Bit at about
${capacity.estimatedBitMinutes} minutes, and do not exceed the maximum of ${capacity.maxBits} Bits.
Prioritize complete coverage of the most important material when the source is too large.

Source material:
${input.text}`, planResponseSchema);
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

import { planInputSchema, planResponseSchema } from "@/lib/api-schemas";
import { generateValidated, jsonError } from "@/lib/ai";
import { ZodError } from "zod";

const systemPrompt = `PLAN: You split study material into 'Bits': focused 5-20 minute units, each
covering ONE concept. Keep content as verbatim slices of the source, do not
rewrite it. For each Bit return title, content, a one-sentence takeaway, and
weight 1-3 for difficulty. Return JSON only.`;

export async function POST(request: Request) {
  try {
    const input = planInputSchema.parse(await request.json());
    const result = await generateValidated(`${systemPrompt}

Return an object with a "bits" array. Do not include dates or IDs in the Bits.
The exam date is ${input.examDate}; use it only to judge an appropriate amount of material.
The learner has ${input.dailyMinutes} minutes per day.

Source material:
${input.text}`, planResponseSchema);
    return Response.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid plan request.", details: error.issues }, { status: 400 });
    }
    return jsonError(error);
  }
}

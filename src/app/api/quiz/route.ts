import { quizInputSchema, quizResponseSchema } from "@/lib/api-schemas";
import { generateValidated, jsonError } from "@/lib/ai";
import { ZodError } from "zod";

const systemPrompt = `QUIZ: Write questions testing understanding, not trivia, using only facts
from the Bit text. Return JSON only, with no markdown or commentary. The
response must have exactly one top-level property named "questions".
Every question object must use exactly these property names:
"type", "prompt", "options", "answer", "explanation", "hint", "difficulty",
and "topic". "prompt" is the question text; do not call it "question" or
"text". "type" must be "mcq", "tf", or "fill". "answer", "explanation",
"difficulty", and "topic" are required. "hint" is optional. "options" is
required for mcq and tf, and must be omitted for fill.`;

export async function POST(request: Request) {
  try {
    const { bit } = quizInputSchema.parse(await request.json());
    const result = await generateValidated(`${systemPrompt}

Return an object with a "questions" array containing exactly 4 question objects
in this composition: 2 "mcq", 1 "tf", and 1 "fill".
For every question, use "prompt" for the question text.
For each "mcq", include exactly four string options.
For "tf", include exactly the string options ["True", "False"].
For "fill", omit the "options" property entirely.
Use difficulty as the number 1, 2, or 3. Do not return a "short" question.
Bit title: ${bit.title}
Bit text:
${bit.content}`, quizResponseSchema, 3);
    return Response.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid quiz request.", details: error.issues }, { status: 400 });
    }
    return jsonError(error);
  }
}

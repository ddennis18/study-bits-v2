import { quizInputSchema, quizResponseSchema } from "@/lib/api-schemas";
import { generateValidated, jsonError } from "@/lib/ai";
import { ZodError } from "zod";

const systemPrompt = `QUIZ: Write questions testing understanding, not trivia. MCQ has 4 options
with plausible distractors. Every question needs a 1-2 sentence explanation
of why the answer is right, an optional hint that doesn't give away the
answer, a topic label, and difficulty 1-3. Only use facts in the text.
Return JSON only.`;

export async function POST(request: Request) {
  try {
    const { bit } = quizInputSchema.parse(await request.json());
    const result = await generateValidated(`${systemPrompt}

Return an object with a "questions" array containing exactly 4 questions: 2 "mcq", 1 "tf", and 1 "fill".
For "mcq" include exactly four options. For "tf" include exactly ["True", "False"]. Do not include options for "fill".
Bit title: ${bit.title}
Bit text:
${bit.content}`, quizResponseSchema);
    return Response.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid quiz request.", details: error.issues }, { status: 400 });
    }
    return jsonError(error);
  }
}

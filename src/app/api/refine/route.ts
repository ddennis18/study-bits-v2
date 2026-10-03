import { refineInputSchema, refineResponseSchema } from "@/lib/api-schemas";
import { generateValidated, jsonError } from "@/lib/ai";
import { ZodError } from "zod";

const actionInstructions = {
  explain: "Explain the answer more clearly while keeping it accurate and grounded in the card.",
  example: "Give one concrete example that makes the card easier to understand without adding unsupported claims.",
  simplify: "Rewrite the answer in simpler language without losing its essential meaning.",
  split: "Suggest two smaller atomic flashcards from this card. Return them as a concise numbered list.",
};

export async function POST(request: Request) {
  try {
    const { card, action } = refineInputSchema.parse(await request.json());
    const result = await generateValidated(`Refine the following flashcard. Return JSON only with a single "result" string.
Action: ${action}
Instruction: ${actionInstructions[action]}
Front: ${card.front}
Back: ${card.back}
Source snippet: ${card.sourceSnippet ?? "Not provided"}`, refineResponseSchema);
    return Response.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid refine request.", details: error.issues }, { status: 400 });
    }
    return jsonError(error);
  }
}

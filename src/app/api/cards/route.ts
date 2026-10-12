import { cardsInputSchema, cardsResponseSchema } from "@/lib/api-schemas";
import { generateValidated, jsonError } from "@/lib/ai";
import { ZodError } from "zod";

const systemPrompt = `CARDS: Create atomic flashcards from this Bit, with one fact per card.
The front is a question or cloze, and the back is under 25 words. The
sourceSnippet must be an exact quote of at most 30 words from the Bit text.
Never add facts not in the Bit text. Return JSON only, with no markdown or
commentary. The response must have exactly one top-level property named
"cards". Each card must have exactly these properties: "front" (non-empty
string), "back" (non-empty string), and "sourceSnippet" (non-empty string).`;

export async function POST(request: Request) {
  try {
    const { bit } = cardsInputSchema.parse(await request.json());
    const result = await generateValidated(`${systemPrompt}

Return an object with a "cards" array containing 3 to 5 cards for this Bit.
Use the exact property names "front", "back", and "sourceSnippet"; do not use
aliases such as "question", "answer", "text", or "source".
Bit title: ${bit.title}
Bit text:
${bit.content}`, cardsResponseSchema, 2);
    return Response.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid cards request.", details: error.issues }, { status: 400 });
    }
    return jsonError(error);
  }
}

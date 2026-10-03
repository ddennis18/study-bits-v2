import { cardsInputSchema, cardsResponseSchema } from "@/lib/api-schemas";
import { generateValidated, jsonError } from "@/lib/ai";
import { ZodError } from "zod";

const systemPrompt = `CARDS: Create atomic flashcards from this text: one fact per card, front is a
question or cloze, back is under 25 words. Include sourceSnippet: an exact
quote (max 30 words) from the text supporting the card. Never add facts not
in the text. Return JSON only.`;

export async function POST(request: Request) {
  try {
    const { bit } = cardsInputSchema.parse(await request.json());
    const result = await generateValidated(`${systemPrompt}

Return an object with a "cards" array containing 3 to 5 cards for this Bit.
Bit title: ${bit.title}
Bit text:
${bit.content}`, cardsResponseSchema);
    return Response.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid cards request.", details: error.issues }, { status: 400 });
    }
    return jsonError(error);
  }
}

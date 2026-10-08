import { GoogleGenerativeAI } from "@google/generative-ai";
import type { z } from "zod";

const modelName = "gemini-3.8-flash";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ApiError("GEMINI_API_KEY is not configured.", 503);
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });
}

function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(cleaned);
}

export async function generateValidated<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  const model = getModel();
  let lastError = "The response was not valid JSON matching the required schema.";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await model.generateContent(attempt === 0 ? prompt : `${prompt}\n\nYour previous response was invalid. Return only corrected JSON that matches the requested shape exactly. Do not include markdown fences or commentary.`);
      const parsed = parseJson(response.response.text());
      return schema.parse(parsed);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      lastError = error instanceof Error ? error.message : lastError;
    }
  }

  throw new ApiError(`Gemini returned invalid output after one retry: ${lastError}`, 502);
}

export function jsonError(error: unknown) {
  const status = error instanceof ApiError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return Response.json({ error: message }, { status });
}

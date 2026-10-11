import { GoogleGenerativeAI } from "@google/generative-ai";
import type { z } from "zod";

const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
let nextKeyIndex = 0;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getApiKeys() {
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3]
    .map((key) => key?.trim())
    .filter((key): key is string => Boolean(key));
  if (keys.length === 0) throw new ApiError("No Gemini API key is configured.", 503);
  return keys;
}

function getModel(apiKey: string) {
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
  const keys = getApiKeys();
  let lastError = "The response was not valid JSON matching the required schema.";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const attemptStartedAt = Date.now();
    const keySlot = nextKeyIndex % keys.length;
    try {
      const apiKey = keys[keySlot];
      nextKeyIndex = (nextKeyIndex + 1) % keys.length;
      const model = getModel(apiKey);
      const response = await model.generateContent(attempt === 0 ? prompt : `${prompt}\n\nYour previous response was invalid. Return only corrected JSON that matches the requested shape exactly. Do not include markdown fences or commentary.`);
      const parsed = parseJson(response.response.text());
      const result = schema.parse(parsed);
      console.info("[ai] generation succeeded", {
        attempt: attempt + 1,
        keySlot: keySlot + 1,
        durationMs: Date.now() - attemptStartedAt,
      });
      return result;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      lastError = error instanceof Error ? error.message : lastError;
      console.warn("[ai] generation attempt failed", {
        attempt: attempt + 1,
        keySlot: keySlot + 1,
        durationMs: Date.now() - attemptStartedAt,
        error: lastError,
      });
    }
  }

  throw new ApiError(`Gemini returned invalid output after one retry: ${lastError}`, 502);
}

export function jsonError(error: unknown) {
  const status = error instanceof ApiError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return Response.json({ error: message }, { status });
}

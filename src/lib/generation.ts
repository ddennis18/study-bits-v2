import type { Bit, Flashcard, Plan, QuizQuestion } from "./types";

export type GeneratedDraft = {
  plan: Plan;
  bits: Bit[];
  cards: Flashcard[];
  questions: QuizQuestion[];
};

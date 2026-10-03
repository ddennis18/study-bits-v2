"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Bit,
  BitStatus,
  Flashcard,
  Plan,
  QuizQuestion,
  ReviewResult,
} from "./types";

type NewBit = Omit<Bit, "id">;
type NewFlashcard = Omit<Flashcard, "id">;
type NewQuestion = Omit<QuizQuestion, "id">;

type StudyStore = {
  plan: Plan | null;
  bits: Bit[];
  cards: Flashcard[];
  questions: QuizQuestion[];
  reviewResults: ReviewResult[];
  setPlan: (plan: Plan | null) => void;
  addBit: (bit: NewBit) => Bit;
  updateBit: (id: string, patch: Partial<Pick<Bit, "title" | "content" | "takeaway" | "estMinutes" | "weight" | "scheduledDate" | "status">>) => void;
  setBitStatus: (id: string, status: BitStatus) => void;
  addCard: (card: NewFlashcard) => Flashcard;
  updateCard: (id: string, patch: Partial<Omit<Flashcard, "id" | "bitId">>) => void;
  reviewCard: (id: string, rating: ReviewResult["rating"]) => void;
  addQuestion: (question: NewQuestion) => QuizQuestion;
  updateQuestion: (id: string, patch: Partial<Omit<QuizQuestion, "id" | "bitId">>) => void;
  recordReviewResult: (result: Omit<ReviewResult, "id" | "reviewedAt"> & { reviewedAt?: string }) => void;
  seed: (data: { plan: Plan; bits: Bit[]; cards: Flashcard[]; questions: QuizQuestion[] }) => void;
  reset: () => void;
};

const initialState = {
  plan: null,
  bits: [] as Bit[],
  cards: [] as Flashcard[],
  questions: [] as QuizQuestion[],
  reviewResults: [] as ReviewResult[],
};

const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const reviewIntervals: Record<ReviewResult["rating"], number> = {
  again: 0,
  hard: 1,
  good: 3,
  easy: 7,
};

const nextSrsState = (rating: ReviewResult["rating"], reps: number) => {
  if (rating === "again") return "learning" as const;
  if (rating === "easy" || reps >= 2) return "review" as const;
  return "learning" as const;
};

export const useStudyStore = create<StudyStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setPlan: (plan) => set({ plan }),
      addBit: (bit) => {
        const created = { ...bit, id: createId("bit") };
        set((state) => ({ bits: [...state.bits, created] }));
        return created;
      },
      updateBit: (id, patch) => set((state) => ({ bits: state.bits.map((bit) => bit.id === id ? { ...bit, ...patch } : bit) })),
      setBitStatus: (id, status) => set((state) => ({ bits: state.bits.map((bit) => bit.id === id ? { ...bit, status } : bit) })),
      addCard: (card) => {
        const created = { ...card, id: createId("card") };
        set((state) => ({ cards: [...state.cards, created] }));
        return created;
      },
      updateCard: (id, patch) => set((state) => ({ cards: state.cards.map((card) => card.id === id ? { ...card, ...patch } : card) })),
      reviewCard: (id, rating) => {
        const card = get().cards.find((item) => item.id === id);
        if (!card) return;
        const reps = rating === "again" ? card.srs.reps : card.srs.reps + 1;
        const intervalDays = reviewIntervals[rating];
        const due = new Date();
        due.setDate(due.getDate() + intervalDays);
        get().updateCard(id, {
          srs: {
            ...card.srs,
            state: nextSrsState(rating, reps),
            intervalDays,
            due: due.toISOString().slice(0, 10),
            reps,
            lapses: rating === "again" ? card.srs.lapses + 1 : card.srs.lapses,
            ease: Math.max(1.3, card.srs.ease + (rating === "easy" ? 0.15 : rating === "hard" ? -0.15 : rating === "again" ? -0.2 : 0)),
          },
        });
        get().recordReviewResult({ cardId: id, rating });
      },
      addQuestion: (question) => {
        const created = { ...question, id: createId("question") };
        set((state) => ({ questions: [...state.questions, created] }));
        return created;
      },
      updateQuestion: (id, patch) => set((state) => ({ questions: state.questions.map((question) => question.id === id ? { ...question, ...patch } : question) })),
      recordReviewResult: (result) => set((state) => ({ reviewResults: [...state.reviewResults, { ...result, id: createId("review"), reviewedAt: result.reviewedAt ?? new Date().toISOString() }] })),
      seed: (data) => set({ ...data, reviewResults: [] }),
      reset: () => set(initialState),
    }),
    {
      name: "studybits-store",
      storage: createJSONStorage(() => window.localStorage),
    },
  ),
);

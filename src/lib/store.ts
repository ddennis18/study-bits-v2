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
import { reviewSrs, type ReviewRating } from "./srs";

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
  reviewCard: (id: string, rating: ReviewRating) => void;
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
        const examDate = get().plan?.examDate;
        if (!examDate) return;
        const nextSrs = reviewSrs(card.srs, rating, examDate);
        get().updateCard(id, {
          srs: nextSrs,
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

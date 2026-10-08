"use client";

import { useEffect, useRef, useState } from "react";
import type { Bit, Flashcard, QuizQuestion } from "@/lib/types";
import { useStudyStore } from "@/lib/store";
import { Skeleton, Toast } from "./study-bits-app";

type CardsResponse = { cards: Array<{ front: string; back: string; sourceSnippet: string }> };
type QuizResponse = { questions: Array<Omit<QuizQuestion, "id" | "bitId" | "flagged">> };

async function request<T>(url: string, bit: Bit) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bit }) });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Generation failed.");
  return result;
}

export function LazyGeneration({ bits, cards, questions }: { bits: Bit[]; cards: Flashcard[]; questions: QuizQuestion[] }) {
  const addCard = useStudyStore((state) => state.addCard);
  const addQuestion = useStudyStore((state) => state.addQuestion);
  const requested = useRef(new Set<string>());
  const [error, setError] = useState("");
  const missingBits = bits.filter((bit) => !cards.some((card) => card.bitId === bit.id) || !questions.some((question) => question.bitId === bit.id));

  useEffect(() => {
    for (const bit of missingBits) {
      if (requested.current.has(bit.id)) continue;
      requested.current.add(bit.id);
      void Promise.all([request<CardsResponse>("/api/cards", bit), request<QuizResponse>("/api/quiz", bit)]).then(([cardsResult, quizResult]) => {
        cardsResult.cards.forEach((card) => addCard({ bitId: bit.id, ...card, srs: { state: "new", ease: 2.5, intervalDays: 0, due: bit.scheduledDate, reps: 0, lapses: 0 } }));
        quizResult.questions.forEach((question) => addQuestion({ bitId: bit.id, ...question, flagged: false }));
      }).catch(() => {
        setError("Some later Bits could not be prepared yet. We&apos;ll try again when you return.");
        requested.current.delete(bit.id);
      });
    }
  }, [addCard, addQuestion, missingBits]);

  return missingBits.length > 0 ? <><div role="status" className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm font-bold text-slate-600"><Skeleton className="h-8 w-8 shrink-0" /><span>Preparing more study material...</span></div>{error && <Toast message={error} />}</> : null;
}

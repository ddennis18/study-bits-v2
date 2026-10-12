"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const addCard = useStudyStore((state) => state.addCard);
  const addQuestion = useStudyStore((state) => state.addQuestion);
  const requested = useRef(new Set<string>());
  const [error, setError] = useState("");
  const requestedBitId = pathname === "/flashcards" || pathname === "/quiz" ? searchParams.get("bit") : null;
  const requestedBit = requestedBitId ? bits.find((bit) => bit.id === requestedBitId) : undefined;
  const hasCards = requestedBit ? cards.some((card) => card.bitId === requestedBit.id) : false;
  const hasQuestions = requestedBit ? questions.some((question) => question.bitId === requestedBit.id) : false;
  const needsGeneration = requestedBit && (!hasCards || !hasQuestions);

  useEffect(() => {
    if (!requestedBit || !needsGeneration || requested.current.has(requestedBit.id)) return;

    requested.current.add(requestedBit.id);
    const cardRequest = hasCards
      ? Promise.resolve(null)
      : request<CardsResponse>("/api/cards", requestedBit);
    const quizRequest = hasQuestions
      ? Promise.resolve(null)
      : request<QuizResponse>("/api/quiz", requestedBit);

    void Promise.all([cardRequest, quizRequest]).then(([cardsResult, quizResult]) => {
      cardsResult?.cards.forEach((card) => addCard({ bitId: requestedBit.id, ...card, srs: { state: "new", ease: 2.5, intervalDays: 0, due: requestedBit.scheduledDate, reps: 0, lapses: 0 } }));
      quizResult?.questions.forEach((question) => addQuestion({ bitId: requestedBit.id, ...question, flagged: false }));
    }).catch(() => {
      window.dispatchEvent(new CustomEvent("studybits:generation-error", { detail: { bitId: requestedBit.id } }));
      setError("This Bit could not be prepared yet. Try again when you return.");
      requested.current.delete(requestedBit.id);
    });
  }, [addCard, addQuestion, hasCards, hasQuestions, needsGeneration, requestedBit]);

  return needsGeneration && !error ? <><div role="status" className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm font-bold text-slate-600"><Skeleton className="h-8 w-8 shrink-0" /><span>Preparing study material...</span></div>{error && <Toast message={error} />}</> : error ? <Toast message={error} /> : null;
}

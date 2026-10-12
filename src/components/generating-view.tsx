"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { mockData } from "@/lib/mock";
import { scheduleBits } from "@/lib/scheduler";
import { useStudyStore } from "@/lib/store";
import type { Bit, Flashcard, Plan, QuizQuestion } from "@/lib/types";
import type { GeneratedDraft } from "@/lib/generation";
import { Button, Card, Icon, ProgressBar, Skeleton, Toast } from "./study-bits-app";

const stages = ["Reading your material", "Splitting into Bits", "Scheduling your days", "Writing flashcards and quiz"];

type GenerationRequest = { text?: string; fileData?: string; fileName?: string; examDate: string; dailyMinutes: number };

type PlanResponse = { title: string; bits: Array<{ title: string; content: string; takeaway: string; weight: 1 | 2 | 3 }> };
type CardsResponse = { cards: Array<{ front: string; back: string; sourceSnippet: string }> };
type QuizResponse = { questions: Array<Omit<QuizQuestion, "id" | "bitId" | "flagged">> };

async function jsonRequest<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "The request failed.");
  return result;
}

export function GeneratingView() {
  const router = useRouter();
  const seed = useStudyStore((state) => state.seed);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const started = useRef(false);

  const generate = useCallback(async () => {
    try {
      const raw = sessionStorage.getItem("studybits-generation");
      if (!raw) throw new Error("Your study request expired. Start again from New material.");
      const request = JSON.parse(raw) as GenerationRequest;
      let text = request.text ?? "";
      setStage(0);
      if (request.fileData) {
        const response = await fetch(request.fileData);
        const blob = await response.blob();
        const formData = new FormData();
        formData.append("file", new File([blob], request.fileName ?? "study-material.pdf", { type: "application/pdf" }));
        const extractResponse = await fetch("/api/extract", { method: "POST", body: formData });
        const extracted = await extractResponse.json() as { text?: string; error?: string };
        if (!extractResponse.ok) throw new Error(extracted.error ?? "Could not read this PDF.");
        text = extracted.text ?? "";
      }
      if (!text.trim()) throw new Error("No study text was found.");

      setStage(1);
      const planResult = await jsonRequest<PlanResponse>("/api/plan", { text, examDate: request.examDate, dailyMinutes: request.dailyMinutes });
      const planId = `plan-${crypto.randomUUID()}`;
      const today = new Date().toISOString().slice(0, 10);
      const unscheduledBits: Bit[] = planResult.bits.map((bit, index) => ({ id: `${planId}-bit-${index + 1}`, planId, order: index + 1, ...bit, estMinutes: Math.min(20, Math.max(5, Math.round(request.dailyMinutes / 2))), scheduledDate: today, status: "todo" }));
      setStage(2);
      const bits = scheduleBits(unscheduledBits, request.examDate, request.dailyMinutes);
      const plan: Plan = { id: planId, title: planResult.title, examDate: request.examDate, dailyMinutes: request.dailyMinutes, createdAt: new Date().toISOString() };
      setStage(3);
      const firstBits = bits.slice(0, 1);
      const generated = await Promise.all(firstBits.map(async (bit) => {
        const [cardsResult, quizResult] = await Promise.all([
          jsonRequest<CardsResponse>("/api/cards", { bit }),
          jsonRequest<QuizResponse>("/api/quiz", { bit }),
        ]);
        const cards: Flashcard[] = cardsResult.cards.map((card, index) => ({ id: `${bit.id}-card-${index + 1}`, bitId: bit.id, ...card, srs: { state: "new", ease: 2.5, intervalDays: 0, due: bit.scheduledDate, reps: 0, lapses: 0 } }));
        const questions: QuizQuestion[] = quizResult.questions.map((question, index) => ({ id: `${bit.id}-question-${index + 1}`, bitId: bit.id, ...question, flagged: false }));
        return { cards, questions };
      }));
      const draft: GeneratedDraft = { plan, bits, cards: generated.flatMap((item) => item.cards), questions: generated.flatMap((item) => item.questions) };
      sessionStorage.setItem("studybits-generated-draft", JSON.stringify(draft));
      sessionStorage.removeItem("studybits-generation");
      router.push("/preview");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong while building your plan.");
    }
  }, [router]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void generate();
  }, [generate]);

  function useSample() {
    seed(mockData);
    sessionStorage.removeItem("studybits-generation");
    router.push("/today");
  }

  return <div className="mx-auto w-full max-w-xl"><Card className="p-7 sm:p-10"><div className="text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-2xl text-white"><Icon name="spark" /></span><p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-primary-600">Building your plan</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">A little thinking, a lot less overwhelm.</h1></div>{error ? <div className="mt-8 space-y-4"><div role="alert" className="rounded-2xl border border-error/20 bg-[#fff1f1] p-4 text-sm leading-6 text-error">{error}</div><div className="flex flex-wrap justify-center gap-3"><Button onClick={() => { setError(""); started.current = false; void generate(); }}>Retry</Button><Button onClick={useSample} variant="secondary">Use sample plan</Button></div></div> : <div className="mt-10 space-y-6"><Skeleton className="h-24 w-full" /><ProgressBar value={Math.round(((stage + 0.5) / stages.length) * 100)} label={`${stages[stage]}...`} /><div className="space-y-3">{stages.map((label, index) => <div key={label} className={`flex items-center gap-3 text-sm font-bold ${index <= stage ? "text-primary-700" : "text-slate-300"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${index < stage ? "bg-success text-white" : index === stage ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-400"}`}>{index < stage ? "✓" : index + 1}</span>{label}</div>)}</div></div>}</Card>{error && <Toast message="We couldn&apos;t build that plan. Try again or use the sample plan." />}</div>;
}

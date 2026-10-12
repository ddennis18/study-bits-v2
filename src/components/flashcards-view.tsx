"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { previewIntervals, type ReviewRating } from "@/lib/srs";
import { useStudyStore } from "@/lib/store";
import type { Bit, Flashcard } from "@/lib/types";
import { Button, Card, Chip, Icon, LoadingPanel, ProgressBar, Toast } from "./study-bits-app";

type FlashcardsViewProps = {
  cards: Flashcard[];
  bits: Bit[];
};

const ratings: { rating: ReviewRating; label: string; tone: string; icon: "arrow" | "clock" | "check" | "spark" }[] = [
  { rating: "again", label: "Again", tone: "border-error/20 bg-[#fff1f1] text-error hover:bg-[#ffe4e4]", icon: "arrow" },
  { rating: "hard", label: "Hard", tone: "border-warning/25 bg-[#fff8e8] text-[#996509] hover:bg-[#fff1cf]", icon: "clock" },
  { rating: "good", label: "Good", tone: "border-success/20 bg-[#edf9f2] text-success hover:bg-[#dcf3e6]", icon: "check" },
  { rating: "easy", label: "Easy", tone: "border-primary-100 bg-primary-50 text-primary-700 hover:bg-primary-100", icon: "spark" },
];

function isDue(card: Flashcard, now: Date) {
  return new Date(card.srs.due).getTime() <= now.getTime();
}

function queueCards(cards: Flashcard[], now: Date) {
  const dueLearning = cards.filter((card) => card.srs.state === "learning" && isDue(card, now));
  const dueReviews = cards.filter((card) => card.srs.state === "review" && isDue(card, now));
  const newCards = cards.filter((card) => card.srs.state === "new");
  return [...dueLearning, ...dueReviews, ...newCards];
}

export function FlashcardsView({ cards, bits }: FlashcardsViewProps) {
  const searchParams = useSearchParams();
  const scopedBitId = searchParams.get("bit");
  const scopedCards = scopedBitId ? cards.filter((card) => card.bitId === scopedBitId) : cards;
  const [failedBitId, setFailedBitId] = useState<string | null>(null);
  const isPreparing = Boolean(scopedBitId && scopedBitId !== failedBitId && bits.some((bit) => bit.id === scopedBitId) && scopedCards.length === 0);
  const [now] = useState(() => new Date());
  const [currentCardId, setCurrentCardId] = useState<string | null>(() => scopedCards[0]?.id ?? null);
  const [flipped, setFlipped] = useState(false);
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [answerAttempt, setAnswerAttempt] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [refineResult, setRefineResult] = useState("");
  const [refineError, setRefineError] = useState("");
  const [refining, setRefining] = useState(false);
  const reviewCard = useStudyStore((state) => state.reviewCard);
  const queue = queueCards(scopedCards, now);
  const currentIndex = queue.findIndex((card) => card.id === currentCardId);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentCard = queue[activeIndex];
  const currentBit = currentCard ? bits.find((bit) => bit.id === currentCard.bitId) : undefined;
  const intervalLabels = currentCard ? previewIntervals(currentCard) : previewIntervals({ srs: { state: "new", ease: 2.5, intervalDays: 0, due: "", reps: 0, lapses: 0 } });
  const newCount = scopedCards.filter((card) => card.srs.state === "new").length;
  const learningCount = scopedCards.filter((card) => card.srs.state === "learning").length;
  const dueCount = scopedCards.filter((card) => isDue(card, now)).length;
  const nextDue = scopedCards.filter((card) => !isDue(card, now)).sort((a, b) => new Date(a.srs.due).getTime() - new Date(b.srs.due).getTime())[0];

  useEffect(() => {
    if (!scopedBitId) return;
    const onGenerationError = (event: Event) => {
      const detail = (event as CustomEvent<{ bitId?: string }>).detail;
      if (detail?.bitId === scopedBitId) setFailedBitId(scopedBitId);
    };
    window.addEventListener("studybits:generation-error", onGenerationError);
    return () => window.removeEventListener("studybits:generation-error", onGenerationError);
  }, [scopedBitId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === " ") {
        event.preventDefault();
        if (currentCard) setFlipped((value) => !value);
      }
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
      if (flipped && /^[1-4]$/.test(event.key)) grade(ratings[Number(event.key) - 1].rating);
      if (event.key === "?") setShortcutsOpen((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function move(direction: number) {
    if (queue.length === 0) return;
    const index = activeIndex;
    const nextIndex = (index + direction + queue.length) % queue.length;
    setCurrentCardId(queue[nextIndex].id);
    setFlipped(false);
    setShowSource(false);
    setAnswerAttempt("");
  }

  function grade(rating: ReviewRating) {
    if (!currentCard) return;
    const nextCard = queue[activeIndex + 1] ?? queue[0];
    reviewCard(currentCard.id, rating);
    setCurrentCardId(nextCard?.id ?? null);
    setFlipped(false);
    setShowSource(false);
    setAnswerAttempt("");
  }

  async function refine(action: "explain" | "example" | "simplify" | "split") {
    if (!currentCard) return;
    setRefining(true);
    setRefineResult("");
    setRefineError("");
    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card: currentCard, action }),
      });
      const result = await response.json() as { result?: string; error?: string };
      if (response.ok) setRefineResult(result.result ?? "No refinement returned.");
      else {
        const message = result.error ?? "Unable to refine this card.";
        setRefineResult(message);
        setRefineError("We couldn&apos;t refine that card. Please try again.");
      }
    } catch {
      setRefineResult("Unable to reach the refine service.");
      setRefineError("The refine service is unavailable right now.");
    } finally {
      setRefining(false);
    }
  }

  if (isPreparing) {
    return <LoadingPanel title="Preparing your flashcards" description="Creating cards for this Bit. They will appear here as soon as they are ready." />;
  }

  return <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
    <div className="flex flex-col gap-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary-600">Active recall</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Flashcards</h1><p className="mt-2 text-sm text-slate-500">{scopedBitId ? "Focused practice for this Bit." : "Review your cards at your own pace."}</p></div><div className="flex gap-2"><div className="relative"><Button variant="secondary" onClick={() => setShortcutsOpen((value) => !value)} aria-label="Show keyboard shortcuts">?</Button>{shortcutsOpen && <div className="absolute right-0 top-14 z-10 w-64 rounded-2xl border border-line bg-white p-4 shadow-xl"><p className="text-xs font-black uppercase tracking-wider text-primary-600">Shortcuts</p><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Flip</dt><dd className="font-black text-slate-800">Space</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Navigate</dt><dd className="font-black text-slate-800">← / →</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Grade</dt><dd className="font-black text-slate-800">1 / 2 / 3 / 4</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">This legend</dt><dd className="font-black text-slate-800">?</dd></div></dl></div>}</div><div className="relative"><Button variant="secondary" onClick={() => setSettingsOpen((value) => !value)}>Settings</Button>{settingsOpen && <div className="absolute right-0 top-14 z-10 w-64 rounded-2xl border border-line bg-white p-4 shadow-xl"><label className="flex cursor-pointer items-start gap-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={showAnswerInput} onChange={(event) => setShowAnswerInput(event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary-600" />Type your answer first</label><p className="mt-2 text-xs leading-5 text-slate-500">Add a typed recall step before revealing the answer.</p></div>}</div></div></div><ProgressBar value={scopedCards.length === 0 ? 0 : Math.round(((scopedCards.length - queue.length) / scopedCards.length) * 100)} label={`${queue.length} cards remaining`} /><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-primary-50 px-2 py-3"><p className="text-lg font-black text-primary-700">{newCount}</p><p className="text-xs font-bold text-slate-500">New</p></div><div className="rounded-xl bg-[#fff5df] px-2 py-3"><p className="text-lg font-black text-[#996509]">{learningCount}</p><p className="text-xs font-bold text-slate-500">Learning</p></div><div className="rounded-xl bg-[#edf9f2] px-2 py-3"><p className="text-lg font-black text-success">{dueCount}</p><p className="text-xs font-bold text-slate-500">Due</p></div></div></div>
    {currentCard ? <>
      <div className="flex items-center justify-between text-sm font-bold text-slate-500"><button type="button" onClick={() => move(-1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 hover:bg-primary-50 hover:text-primary-700" aria-label="Previous card">← Previous</button><span>{currentIndex + 1} / {queue.length}</span><button type="button" onClick={() => move(1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 hover:bg-primary-50 hover:text-primary-700" aria-label="Next card">Next →</button></div>
      <div className="flashcard-scene" onClick={() => setFlipped((value) => !value)} onKeyDown={(event) => { if (event.key === "Enter") setFlipped((value) => !value); }} role="button" tabIndex={0} aria-label={flipped ? "Flashcard answer" : "Flashcard question"}><div className={`flashcard-inner ${flipped ? "is-flipped" : ""}`}>
        <Card className="flashcard-face flex min-h-[27rem] flex-col items-center justify-center p-7 text-center sm:min-h-[31rem] sm:p-12"><Chip>{currentBit?.title ?? "Study Bit"}</Chip><p className="mt-8 max-w-2xl text-2xl font-black leading-tight text-slate-900 sm:text-4xl">{currentCard.front}</p>{showAnswerInput && <input value={answerAttempt} onChange={(event) => setAnswerAttempt(event.target.value)} onClick={(event) => event.stopPropagation()} placeholder="Type your answer first" aria-label="Type your answer first" className="mt-8 min-h-12 w-full max-w-md rounded-xl border border-line px-4 text-center text-sm outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-50" />}{!flipped && <Button className="mt-8" onClick={() => setFlipped(true)}>Show answer <Icon name="arrow" /></Button>}<p className="mt-auto pt-8 text-xs font-bold text-slate-400">Click or press Space to flip</p></Card>
        <Card className="flashcard-face flashcard-back flex min-h-[27rem] flex-col p-7 sm:min-h-[31rem] sm:p-12"><div className="flex items-center justify-between gap-3"><Chip tone="green"><Icon name="check" /> Answer</Chip><span className="text-xs font-bold text-slate-400">{currentBit?.title}</span></div><p className="mt-8 text-xl font-bold leading-8 text-slate-900 sm:text-2xl">{currentCard.back}</p><div className="mt-8"><button type="button" onClick={(event) => { event.stopPropagation(); setShowSource((value) => !value); }} className="min-h-11 rounded-xl bg-primary-50 px-3 text-sm font-black text-primary-700">Source {showSource ? "−" : "+"}</button>{showSource && <div className="mt-3 rounded-xl bg-primary-50 p-4 text-sm leading-6 text-primary-700">{currentCard.sourceSnippet}<a href="/today" onClick={(event) => event.stopPropagation()} className="mt-3 block font-black underline">Open Bit →</a></div>}</div><div className="mt-auto flex flex-wrap gap-2 pt-8" onClick={(event) => event.stopPropagation()}><Button variant="secondary" onClick={() => refine("explain")}>Explain this</Button><Button variant="secondary" onClick={() => refine("example")}>Give an example</Button><Button variant="secondary" onClick={() => refine("simplify")}>Simplify</Button><Button variant="secondary" onClick={() => refine("split")}>Split</Button></div></Card>
      </div></div>
      <div><p className="mb-2 text-center text-xs font-bold text-slate-400">How well did you recall it?</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{ratings.map((item, index) => <button key={item.rating} type="button" disabled={!flipped} onClick={() => grade(item.rating)} className={`min-h-20 rounded-2xl border px-2 py-3 text-center transition ${item.tone} disabled:cursor-not-allowed disabled:opacity-40`}><span className="flex items-center justify-center gap-1 text-sm font-black"><Icon name={item.icon} />{item.label}</span><span className="mt-1 block text-xs font-bold opacity-75">{intervalLabels[item.rating]} <span className="sr-only">Keyboard shortcut {index + 1}</span></span></button>)}</div></div>
    </> : <Card className="flex min-h-[28rem] flex-col items-center justify-center px-6 py-12 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf9f2] text-3xl text-success"><Icon name="check" /></span><h2 className="mt-6 text-2xl font-black text-slate-900">All caught up</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">You have cleared every card in the queue.</p>{nextDue && <p className="mt-5 rounded-xl bg-primary-50 px-4 py-3 text-sm font-bold text-primary-700">Next due {new Date(nextDue.srs.due).toLocaleString()}</p>}</Card>}
    {(refineResult || refining) && <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white p-5 shadow-[0_-12px_40px_rgba(0,95,146,0.12)]"><div className="mx-auto flex max-w-4xl items-start justify-between gap-5">
      <div className="flex-1"><p className="text-xs font-black uppercase tracking-[0.16em] text-primary-600">{refining ? "Working" : "Refinement"}</p>{refining ? <div className="mt-3 space-y-2"><div className="h-3 w-3/4 animate-pulse rounded bg-primary-50" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-primary-50" /></div> : <p className="mt-2 text-sm leading-6 text-slate-700">{refineResult}</p>}</div><button type="button" onClick={() => { setRefineResult(""); setRefining(false); }} className="min-h-11 min-w-11 rounded-xl text-2xl text-slate-400 hover:bg-primary-50" aria-label="Close refinement">×</button></div></div>}
    {refineError && <Toast message={refineError} onClose={() => setRefineError("")} />}</div>;
}

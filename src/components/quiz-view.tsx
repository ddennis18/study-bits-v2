"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Bit, QuizQuestion } from "@/lib/types";
import { useStudyStore } from "@/lib/store";
import { Button, Card, Chip, Icon, LoadingPanel, ProgressBar } from "./study-bits-app";

type QuizMode = "quiz" | "study";
type AnswerState = { value: string; correct: boolean };

type QuizViewProps = {
  questions: QuizQuestion[];
  bits: Bit[];
};

const supportedTypes = new Set(["mcq", "tf", "fill"]);

function normalizeAnswer(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[.!?]+$/, "");
}

function acceptedAnswers(question: QuizQuestion) {
  return question.answer.split("|").map(normalizeAnswer);
}

function isCorrect(question: QuizQuestion, value: string) {
  return acceptedAnswers(question).includes(normalizeAnswer(value));
}

export function QuizView({ questions, bits }: QuizViewProps) {
  const searchParams = useSearchParams();
  const scopedBitId = searchParams.get("bit");
  const updateQuestion = useStudyStore((state) => state.updateQuestion);
  const availableQuestions = questions.filter((question) => supportedTypes.has(question.type) && (!scopedBitId || question.bitId === scopedBitId));
  const [failedBitId, setFailedBitId] = useState<string | null>(null);
  const isPreparing = Boolean(scopedBitId && scopedBitId !== failedBitId && bits.some((bit) => bit.id === scopedBitId) && availableQuestions.length === 0);
  const [sessionIds, setSessionIds] = useState(() => availableQuestions.slice(0, 8).map((question) => question.id));
  const sessionQuestions = sessionIds.map((id) => questions.find((question) => question.id === id)).filter((question): question is QuizQuestion => Boolean(question));
  const [mode, setMode] = useState<QuizMode>("quiz");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [fillValue, setFillValue] = useState("");
  const [hintShown, setHintShown] = useState(false);
  const [summary, setSummary] = useState(false);
  const [flagNotice, setFlagNotice] = useState(false);

  const question = sessionQuestions[questionIndex];
  const bit = question ? bits.find((item) => item.id === question.bitId) : undefined;
  const answer = question ? answers[question.id] : undefined;
  const answeredCount = Object.keys(answers).length;
  const gradedAnswers = sessionQuestions.filter((item) => answers[item.id] && !item.flagged);
  const score = gradedAnswers.filter((item) => answers[item.id].correct).length;
  const answeredPercent = sessionQuestions.length === 0 ? 0 : Math.round((answeredCount / sessionQuestions.length) * 100);

  useEffect(() => {
    if (!scopedBitId) return;
    const onGenerationError = (event: Event) => {
      const detail = (event as CustomEvent<{ bitId?: string }>).detail;
      if (detail?.bitId === scopedBitId) setFailedBitId(scopedBitId);
    };
    window.addEventListener("studybits:generation-error", onGenerationError);
    return () => window.removeEventListener("studybits:generation-error", onGenerationError);
  }, [scopedBitId]);

  function submitAnswer(value: string) {
    if (!question || answer) return;
    setAnswers((current) => ({ ...current, [question.id]: { value, correct: isCorrect(question, value) } }));
  }

  function goNext() {
    if (!question || !answer) return;
    if (questionIndex === sessionQuestions.length - 1) {
      setSummary(true);
    } else {
      setQuestionIndex((index) => index + 1);
      setFillValue("");
      setHintShown(false);
      setFlagNotice(false);
    }
  }

  function retryMissed() {
    const missed = sessionQuestions.filter((item) => answers[item.id] && !answers[item.id].correct && !item.flagged).map((item) => item.id);
    if (missed.length === 0) return;
    setSessionIds(missed);
    setQuestionIndex(0);
    setAnswers({});
    setFillValue("");
    setHintShown(false);
    setSummary(false);
  }

  function restartQuiz() {
    setSessionIds(availableQuestions.slice(0, 8).map((item) => item.id));
    setQuestionIndex(0);
    setAnswers({});
    setFillValue("");
    setHintShown(false);
    setFlagNotice(false);
    setSummary(false);
  }

  function toggleFlag() {
    if (!question) return;
    updateQuestion(question.id, { flagged: !question.flagged });
    setFlagNotice(true);
  }

  if (isPreparing) {
    return <LoadingPanel title="Preparing your quiz" description="Writing questions for this Bit. Your quiz will appear here as soon as it is ready." />;
  }

  if (summary) {
    const topics = [...new Set(sessionQuestions.map((item) => item.topic))].map((topic) => {
      const topicQuestions = sessionQuestions.filter((item) => item.topic === topic && !item.flagged);
      const topicCorrect = topicQuestions.filter((item) => answers[item.id]?.correct).length;
      return { topic, total: topicQuestions.length, correct: topicCorrect, percent: topicQuestions.length ? Math.round((topicCorrect / topicQuestions.length) * 100) : 0 };
    }).sort((a, b) => a.percent - b.percent);
    const weakest = topics.find((topic) => topic.total > 0);
    return <Card className="mx-auto w-full max-w-3xl p-6 sm:p-10"><div className="text-center"><Chip tone={mode === "quiz" ? "blue" : "green"}>{mode === "quiz" ? "Quiz complete" : "Study complete"}</Chip><h1 className="mt-5 text-3xl font-black text-slate-900">{mode === "quiz" ? `${score} / ${gradedAnswers.length} correct` : "Nice work"}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{mode === "quiz" ? "Flagged questions are excluded from your score." : "You reviewed this set without a graded score."}</p></div><div className="mt-10 space-y-5"><h2 className="font-black text-slate-900">Accuracy by topic</h2>{topics.map((topic) => <div key={topic.topic} className="space-y-2"><div className="flex items-center justify-between gap-4 text-sm font-bold"><span className="text-slate-700">{topic.topic}</span><span className="text-primary-700">{topic.correct}/{topic.total}</span></div><ProgressBar value={topic.percent} label={`${topic.topic} accuracy`} /></div>)}</div>{weakest && <div className="mt-8 rounded-2xl border border-warning/20 bg-[#fff8e8] p-4 text-sm leading-6 text-[#805b12]"><strong>Focus next:</strong> {weakest.topic} is your weakest topic at {weakest.percent}%.</div>}<div className="mt-8 flex flex-wrap justify-center gap-3"><Button onClick={retryMissed} variant="primary" className={gradedAnswers.some((item) => !answers[item.id]?.correct) ? "" : "opacity-50"}>Retry missed questions <Icon name="arrow" /></Button><Button onClick={restartQuiz} variant="secondary">Restart quiz</Button><Button href="/" variant="secondary">Back to overview</Button></div></Card>;
  }

  if (!question) {
    return <Card className="mx-auto w-full max-w-3xl p-10 text-center"><h1 className="text-2xl font-black text-slate-900">No quiz questions yet</h1><p className="mt-2 text-sm text-slate-500">Add study material to generate a quiz.</p></Card>;
  }

  return <div className="mx-auto flex w-full max-w-3xl flex-col gap-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary-600">{bit?.title ?? "StudyBits"}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Quick quiz</h1><p className="mt-2 text-sm text-slate-500">{mode === "quiz" ? "Answer from memory, then review the explanation." : "Study the answer and explanation without scoring."}</p></div><div className="flex rounded-xl border border-line bg-white p-1" role="group" aria-label="Quiz mode"><button type="button" onClick={() => setMode("quiz")} className={`min-h-11 rounded-lg px-4 text-sm font-black ${mode === "quiz" ? "bg-primary-600 text-white" : "text-slate-500 hover:bg-primary-50"}`}>Quiz</button><button type="button" onClick={() => setMode("study")} className={`min-h-11 rounded-lg px-4 text-sm font-black ${mode === "study" ? "bg-primary-600 text-white" : "text-slate-500 hover:bg-primary-50"}`}>Study</button></div></div><div className="flex items-center justify-between gap-4"><p className="text-sm font-black text-slate-700">Question {questionIndex + 1} of {sessionQuestions.length}</p><button type="button" onClick={toggleFlag} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold ${question.flagged ? "bg-[#fff8e8] text-[#996509]" : "text-slate-400 hover:bg-primary-50 hover:text-primary-700"}`} aria-label="Report a problem with this question">⚑ {question.flagged ? "Flagged" : "Report a problem"}</button></div><ProgressBar value={answeredPercent} label="Quiz progress" /><Card className="p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><Chip tone={question.difficulty === 3 ? "amber" : "blue"}>{question.topic}</Chip><span className="text-xs font-black uppercase tracking-wider text-slate-400">{question.type}</span></div><h2 className="mt-7 text-xl font-black leading-8 text-slate-900 sm:text-2xl">{question.prompt}</h2>{mode === "study" && question.hint && <div className="mt-5 rounded-xl border border-warning/20 bg-[#fff8e8] p-4 text-sm leading-6 text-[#805b12]"><strong>Hint:</strong> {question.hint}</div>}{mode === "quiz" && !hintShown && question.hint && !answer && <button type="button" onClick={() => setHintShown(true)} className="mt-5 min-h-11 text-sm font-black text-[#996509] underline decoration-[#e39b1b] underline-offset-4">Show hint</button>}{mode === "quiz" && hintShown && question.hint && <div className="mt-5 rounded-xl border border-warning/20 bg-[#fff8e8] p-4 text-sm leading-6 text-[#805b12]"><strong>Hint:</strong> {question.hint}</div>}{question.type === "fill" ? <div className="mt-7 flex flex-col gap-3 sm:flex-row"><input value={fillValue} disabled={Boolean(answer)} onChange={(event) => setFillValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitAnswer(fillValue); }} placeholder="Type your answer" aria-label="Your answer" className="min-h-14 flex-1 rounded-xl border border-line px-4 text-base outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-50" /><Button onClick={() => submitAnswer(fillValue)} className="min-h-14">Check answer</Button></div> : <div className="mt-7 grid gap-3">{(question.options ?? []).map((option) => { const selected = answer?.value === option; const right = answer && normalizeAnswer(option) === normalizeAnswer(question.answer); return <button key={option} type="button" disabled={Boolean(answer)} onClick={() => submitAnswer(option)} className={`flex min-h-14 items-center justify-between rounded-xl border px-4 text-left text-sm font-bold transition sm:min-h-16 sm:text-base ${right ? "border-success bg-[#edf9f2] text-success" : selected && answer ? "border-error bg-[#fff1f1] text-error" : "border-line bg-white text-slate-700 hover:border-primary-600 hover:bg-primary-50"}`}><span>{option}</span>{right && <span aria-label="Correct answer">✓</span>}{selected && !right && <span aria-label="Selected incorrect answer">×</span>}</button>; })}</div>}{answer && <div className={`mt-7 rounded-2xl border p-4 ${answer.correct ? "border-success/20 bg-[#edf9f2]" : "border-error/20 bg-[#fff1f1]"}`}><p className={`flex items-center gap-2 font-black ${answer.correct ? "text-success" : "text-error"}`}><span className="text-xl">{answer.correct ? "✓" : "×"}</span>{answer.correct ? "Correct" : "Not quite"}</p><p className="mt-3 text-sm leading-6 text-slate-700">{question.explanation}</p></div>}{flagNotice && <p className="mt-4 text-xs font-bold text-[#996509]">Reported. This question will be excluded from the summary score.</p>}<div className="mt-8 flex justify-end">{answer && <Button onClick={goNext}>{questionIndex === sessionQuestions.length - 1 ? "See summary" : "Next"} <Icon name="arrow" /></Button>}</div></Card></div>;
}

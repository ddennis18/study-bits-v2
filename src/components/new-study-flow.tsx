"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Chip, Icon } from "./study-bits-app";

const dailyOptions = [15, 30, 45, 60, 90];

export function NewStudyFlow() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [error, setError] = useState("");
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [minExamDate] = useState(() => { const date = new Date(); date.setDate(date.getDate() + 1); return date.toISOString().slice(0, 10); });
  const hasMaterial = Boolean(file || text.trim());

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!hasMaterial) return setError("Add a PDF or paste your study material first.");
    if (!examDate || examDate <= today) return setError("Choose an exam date in the future.");
    if (text.length > 120_000) return setError("Pasted text is limited to 120,000 characters.");
    if (file && file.type !== "application/pdf") return setError("Only PDF files are supported.");

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem("studybits-generation", JSON.stringify({ fileData: reader.result, fileName: file.name, examDate, dailyMinutes }));
        router.push("/generating");
      };
      reader.readAsDataURL(file);
    } else {
      sessionStorage.setItem("studybits-generation", JSON.stringify({ text: text.trim(), examDate, dailyMinutes }));
      router.push("/generating");
    }
  }

  return <div className="mx-auto w-full max-w-3xl"><div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-primary-600">New study plan</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Turn material into daily Bits</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Give StudyBits your source material and a deadline. We&apos;ll shape it into focused sessions you can actually finish.</p></div><form onSubmit={submit} className="space-y-5"><Card className="p-5 sm:p-7"><div className="flex items-center justify-between gap-3"><div><h2 className="font-black text-slate-900">Your material</h2><p className="mt-1 text-sm text-slate-500">Upload a PDF or paste the important sections.</p></div><Chip>30 page cap</Chip></div><label className="mt-6 flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary-100 bg-primary-50 px-4 text-sm font-black text-primary-700 hover:border-primary-600"><Icon name="plus" />{file ? file.name : "Choose PDF"}<input type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="sr-only" /></label><div className="my-5 flex items-center gap-3 text-xs font-black uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-line" />or paste text<span className="h-px flex-1 bg-line" /></div><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste lecture notes, a chapter, or a study guide..." className="min-h-44 w-full resize-y rounded-xl border border-line p-4 text-sm leading-6 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-50" /></Card><div className="grid gap-5 sm:grid-cols-2"><Card className="p-5 sm:p-7"><label htmlFor="exam-date" className="font-black text-slate-900">When is your exam?</label><p className="mt-1 text-sm text-slate-500">We&apos;ll protect the final two days for review.</p><input id="exam-date" type="date" min={minExamDate} value={examDate} onChange={(event) => setExamDate(event.target.value)} className="mt-5 min-h-12 w-full rounded-xl border border-line px-4 text-sm font-bold outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-50" /></Card><Card className="p-5 sm:p-7"><fieldset><legend className="font-black text-slate-900">Daily study time</legend><p className="mt-1 text-sm text-slate-500">Choose a pace you can keep.</p><div className="mt-5 grid grid-cols-3 gap-2">{dailyOptions.map((minutes) => <button key={minutes} type="button" onClick={() => setDailyMinutes(minutes)} className={`min-h-12 rounded-xl border text-sm font-black ${dailyMinutes === minutes ? "border-primary-600 bg-primary-600 text-white" : "border-line bg-white text-slate-600 hover:border-primary-600 hover:bg-primary-50"}`}>{minutes} min</button>)}</div></fieldset></Card></div>{error && <p role="alert" className="rounded-xl border border-error/20 bg-[#fff1f1] p-4 text-sm font-bold text-error">{error}</p>}<Button type="submit" className="w-full sm:w-auto"><Icon name="spark" /> Build my study plan</Button></form></div>;
}

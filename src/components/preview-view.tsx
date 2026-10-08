"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GeneratedDraft } from "@/lib/generation";
import { useStudyStore } from "@/lib/store";
import { Button, Card, Chip, Icon } from "./study-bits-app";

function readDraft() {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("studybits-generated-draft");
  return raw ? JSON.parse(raw) as GeneratedDraft : null;
}

export function PreviewView() {
  const router = useRouter();
  const seed = useStudyStore((state) => state.seed);
  const [draft, setDraft] = useState<GeneratedDraft | null>(() => readDraft());
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!draft) return <Card className="mx-auto w-full max-w-2xl p-10 text-center"><h1 className="text-2xl font-black text-slate-900">Preview expired</h1><p className="mt-2 text-sm text-slate-500">Start a new plan to generate editable flashcards.</p><Button href="/new" className="mt-6">New material</Button></Card>;

  function updateCard(id: string, field: "front" | "back" | "sourceSnippet", value: string) {
    setDraft((current) => current && { ...current, cards: current.cards.map((card) => card.id === id ? { ...card, [field]: value } : card) });
  }

  function deleteCard(id: string) {
    setDraft((current) => current && { ...current, cards: current.cards.filter((card) => card.id !== id) });
  }

  function addCard() {
    if (!draft) return;
    const bitId = draft.bits[0]?.id ?? "generated-bit-1";
    const id = `draft-card-${Date.now()}`;
    const due = draft.plan.createdAt.slice(0, 10);
    setDraft((current) => current && { ...current, cards: [...current.cards, { id, bitId, front: "New question", back: "New answer", sourceSnippet: "", srs: { state: "new", ease: 2.5, intervalDays: 0, due, reps: 0, lapses: 0 } }] });
    setEditingId(id);
  }

  function saveAll() {
    if (!draft) return;
    seed(draft);
    sessionStorage.removeItem("studybits-generated-draft");
    router.push("/today");
  }

  return <div className="mx-auto w-full max-w-3xl"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary-600">Tier 2 · Review before saving</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Your flashcards are ready</h1><p className="mt-3 text-sm leading-6 text-slate-500">Edit anything that feels off, remove weak cards, or add your own before the plan is saved.</p></div><Chip>{draft.cards.length} cards</Chip></div><div className="space-y-4">{draft.cards.map((card, index) => <Card key={card.id} className="p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-sm font-black text-primary-700">{index + 1}</span><Chip tone="slate">{draft.bits.find((bit) => bit.id === card.bitId)?.title ?? "Study Bit"}</Chip></div><div className="flex gap-1"><button type="button" onClick={() => setEditingId(editingId === card.id ? null : card.id)} className="min-h-11 min-w-11 rounded-xl text-sm font-black text-primary-700 hover:bg-primary-50" aria-label={`Edit card ${index + 1}`}>{editingId === card.id ? "Done" : "Edit"}</button><button type="button" onClick={() => deleteCard(card.id)} className="min-h-11 min-w-11 rounded-xl text-sm font-black text-error hover:bg-[#fff1f1]" aria-label={`Delete card ${index + 1}`}>×</button></div></div>{editingId === card.id ? <div className="mt-5 space-y-3"><input value={card.front} onChange={(event) => updateCard(card.id, "front", event.target.value)} aria-label="Card question" className="min-h-12 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-50" /><textarea value={card.back} onChange={(event) => updateCard(card.id, "back", event.target.value)} aria-label="Card answer" className="min-h-24 w-full rounded-xl border border-line p-4 text-sm outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-50" /><input value={card.sourceSnippet} onChange={(event) => updateCard(card.id, "sourceSnippet", event.target.value)} aria-label="Card source snippet" placeholder="Source snippet" className="min-h-12 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-50" /></div> : <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-black uppercase tracking-wider text-slate-400">Front</p><p className="mt-2 text-sm font-bold leading-6 text-slate-800">{card.front}</p></div><div><p className="text-xs font-black uppercase tracking-wider text-slate-400">Back</p><p className="mt-2 text-sm leading-6 text-slate-600">{card.back}</p></div></div>}</Card>)}</div><div className="mt-6 flex flex-wrap justify-between gap-3"><Button variant="secondary" onClick={addCard}><Icon name="plus" /> Add card</Button><Button onClick={saveAll}>Save all <Icon name="check" /></Button></div></div>;
}

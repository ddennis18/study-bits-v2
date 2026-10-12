"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import type { ReactNode } from "react";
import { mockData } from "@/lib/mock";
import { useStudyStore } from "@/lib/store";
import type { Bit, Flashcard, Plan, QuizQuestion } from "@/lib/types";
import { FlashcardsView } from "./flashcards-view";
import { LazyGeneration } from "./lazy-generation";
import { QuizView } from "./quiz-view";

type View = "home" | "new" | "today" | "timeline" | "flashcards" | "quiz";

type StudyData = {
    plan: Plan;
    plans: Plan[];
    bits: Bit[];
    cards: Flashcard[];
    questions: QuizQuestion[];
};

type ButtonProps = {
    children: ReactNode;
    href?: string;
    variant?: "primary" | "secondary" | "ghost";
    className?: string;
    onClick?: () => void;
    ariaLabel?: string;
    type?: "button" | "submit";
};

export function Button({ children, href, variant = "primary", className = "", onClick, ariaLabel, type = "button" }: ButtonProps) {
    const styles = {
        primary: "bg-primary-600 text-white shadow-sm shadow-primary-600/20 hover:bg-primary-700",
        secondary: "border border-primary-100 bg-white text-primary-700 hover:border-primary-600 hover:bg-primary-50",
        ghost: "text-slate-600 hover:bg-primary-50 hover:text-primary-700",
    }[variant];
    const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors ${styles} ${className}`;

    if (href) {
        return <Link href={href} aria-label={ariaLabel} className={classes}>{children}</Link>;
    }

    return <button type={type} aria-label={ariaLabel} onClick={onClick} className={classes}>{children}</button>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
    return <section className={`rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(0,95,146,0.05)] ${className}`}>{children}</section>;
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
    return (
        <div className="space-y-2">
            {label && <div className="flex items-center justify-between text-xs font-bold text-slate-500"><span>{label}</span><span className="text-primary-700">{value}%</span></div>}
            <div className="h-2 overflow-hidden rounded-full bg-primary-50" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progress"}>
                <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

export function Skeleton({ className = "" }: { className?: string }) {
    return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-primary-50 ${className}`} />;
}

export function LoadingPanel({ title, description }: { title: string; description: string }) {
    return <Card className="mx-auto flex min-h-72 w-full max-w-3xl flex-col items-center justify-center px-6 py-12 text-center" aria-live="polite">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <h1 className="mt-6 text-2xl font-black text-slate-900">{title}</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </Card>;
}

export function Toast({ message, onClose }: { message: string; onClose?: () => void }) {
    return <div role="alert" className="fixed inset-x-4 bottom-5 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-error/20 bg-white p-4 shadow-[0_12px_40px_rgba(0,95,146,0.18)]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff1f1] font-black text-error">!</span><p className="flex-1 text-sm font-bold leading-6 text-slate-700">{message}</p>{onClose && <button type="button" onClick={onClose} className="min-h-8 min-w-8 rounded-lg text-xl text-slate-400 hover:bg-primary-50" aria-label="Dismiss notification">×</button>}</div>;
}

export function Chip({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "amber" | "slate" }) {
    const styles = {
        blue: "bg-primary-50 text-primary-700",
        green: "bg-[#e8f7ef] text-success",
        amber: "bg-[#fff5df] text-[#996509]",
        slate: "bg-slate-100 text-slate-600",
    }[tone];
    return <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-bold ${styles}`}>{children}</span>;
}

export function Icon({ name }: { name: "check" | "plus" | "arrow" | "spark" | "book" | "calendar" | "cards" | "quiz" | "clock" | "target" }) {
    const icons = {
        check: "✓",
        plus: "+",
        arrow: "→",
        spark: "✦",
        book: "▤",
        calendar: "▦",
        cards: "▱",
        quiz: "?",
        clock: "◷",
        target: "◎",
    };
    return <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center text-[1.05rem] leading-none">{icons[name]}</span>;
}

const navItems = [
    { href: "/", label: "Overview" },
    { href: "/today", label: "Today" },
    { href: "/timeline", label: "Timeline" },
];

export function BottomTabs() {
    const pathname = usePathname();
    const tabs = [
        { href: "/today", label: "Today", icon: "target" as const },
        { href: "/timeline", label: "Timeline", icon: "calendar" as const },
    ];
    return (
        <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
            <div className="mx-auto flex max-w-md justify-around">
                {tabs.map((tab) => {
                    const active = pathname === tab.href;
                    return <Link key={tab.href} href={tab.href} className={`flex min-h-11 min-w-20 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-bold ${active ? "text-primary-700" : "text-slate-400"}`}><Icon name={tab.icon} /><span>{tab.label}</span></Link>;
                })}
            </div>
        </nav>
    );
}

function Header() {
    const pathname = usePathname();
    return (
        <header className="border-b border-line bg-white/80 backdrop-blur">
            <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
                <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-primary-700"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-sm text-white">S</span>StudyBits</Link>
                <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
                    {navItems.map((item) => <Link key={item.href} href={item.href} className={`rounded-lg px-3 py-2 text-sm font-bold ${pathname === item.href ? "bg-primary-50 text-primary-700" : "text-slate-500 hover:bg-primary-50 hover:text-primary-700"}`}>{item.label}</Link>)}
                </nav>
                <div className="flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block text-xs font-bold text-slate-400">YOUR STREAK</span><span className="text-sm font-black text-primary-700">4 days</span></span><span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-black text-primary-700">AM</span></div>
            </div>
        </header>
    );
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
    return <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-primary-600">{eyebrow}</p><h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">{description}</p></div>{action}</div>;
}

function HomeView({ data }: { data: StudyData }) {
    const router = useRouter();
    const seed = useStudyStore((state) => state.seed);
    const completedBits = data.bits.filter((bit) => bit.status === "done").length;
    const progress = data.bits.length === 0 ? 0 : Math.round((completedBits / data.bits.length) * 100);
    const nextBits = data.bits.filter((bit) => bit.status === "todo").slice(0, 3);
    const focusBit = nextBits[0] ?? data.bits[0];
    const createdDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(data.plan.createdAt));
    const remainingBits = data.bits.length - completedBits;
    const plans = [...data.plans].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return <>
        <PageIntro eyebrow={`Plan · Exam ${data.plan.examDate}`} title={data.plan.title} description={`${data.bits.length} focused Bits created on ${createdDate}. You have ${remainingBits} ${remainingBits === 1 ? "Bit" : "Bits"} remaining in this plan.`} action={<div className="flex flex-wrap gap-2"><Button href="/new"><Icon name="plus" /> New material</Button><Button variant="secondary" onClick={() => { seed(mockData); router.push("/today"); }}>Try demo plan</Button></div>} />
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
            <Card className="overflow-hidden bg-primary-700 p-6 text-white sm:p-8"><div className="flex items-start justify-between gap-4"><div><Chip tone="blue">TODAY&apos;S FOCUS</Chip><h2 className="mt-5 max-w-md text-2xl font-black leading-tight sm:text-3xl">{focusBit?.title ?? "Your plan is ready"}</h2><p className="mt-3 max-w-md text-sm leading-6 text-primary-600">{focusBit?.takeaway ?? "Create a plan to start studying."}</p></div><span className="hidden text-5xl text-accent sm:block"><Icon name="spark" /></span></div><div className="mt-8 flex items-end justify-between gap-6"><div className="w-full max-w-sm"><ProgressBar value={progress} label={`${completedBits} of ${data.bits.length} Bits complete`} /></div><Button href={focusBit ? "/today" : "/new"} variant="secondary" className="shrink-0 border-transparent bg-white/95">{focusBit ? "Start Bit" : "Create plan"} <Icon name="arrow" /></Button></div></Card>
            <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Daily target</p><p className="mt-2 text-3xl font-black text-slate-900">{data.plan.dailyMinutes}<span className="text-base text-slate-400"> min</span></p></div><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff5df] text-xl text-warning"><Icon name="target" /></span></div><ProgressBar value={progress} label={`${progress}% complete`} /><div className="mt-6 grid grid-cols-2 gap-3 text-center"><div className="rounded-xl bg-primary-50 p-3"><p className="text-xl font-black text-primary-700">{data.bits.length}</p><p className="text-xs font-bold text-slate-500">Total Bits</p></div><div className="rounded-xl bg-[#e8f7ef] p-3"><p className="text-xl font-black text-success">{data.cards.length}</p><p className="text-xs font-bold text-slate-500">Cards ready</p></div></div><p className="mt-4 text-xs text-slate-400">Created {createdDate}</p></Card>
        </div>
        <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black text-slate-900">Up next</h2><Link href="/timeline" className="text-sm font-bold text-primary-700 hover:text-primary-600">View full plan <Icon name="arrow" /></Link></div>{nextBits.length > 0 ? <div className="grid gap-3 sm:grid-cols-3">{nextBits.map((bit, index) => <Link key={bit.id} href={index === 0 ? `/today` : index === 1 ? `/flashcards?bit=${bit.id}` : `/quiz?bit=${bit.id}`} className="group rounded-2xl border border-line bg-white p-5 shadow-[0_8px_30px_rgba(0,95,146,0.04)] transition hover:-translate-y-0.5 hover:border-primary-100"><span className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl text-lg ${index === 0 ? "bg-primary-50 text-primary-700" : index === 1 ? "bg-[#e8f7ef] text-success" : "bg-[#fff5df] text-warning"}`}><Icon name={index === 0 ? "book" : index === 1 ? "cards" : "quiz"} /></span><h3 className="font-black text-slate-900 group-hover:text-primary-700">{bit.title}</h3><p className="mt-1 text-sm text-slate-500">{bit.estMinutes} min · {data.cards.filter((card) => card.bitId === bit.id).length} cards</p></Link>)}</div> : <Card className="p-6 text-sm font-bold text-slate-500">All Bits in this plan are complete.</Card>}</section>
        <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black text-slate-900">Created plans</h2><span className="text-sm font-bold text-slate-400">{plans.length} total</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{plans.map((plan) => <Card key={plan.id} className={`p-5 ${plan.id === data.plan.id ? "border-primary-300 ring-2 ring-primary-50" : ""}`}><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-900">{plan.title}</p><p className="mt-1 text-xs text-slate-500">Created {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(plan.createdAt))}</p></div>{plan.id === data.plan.id && <Chip tone="blue">Current</Chip>}</div><p className="mt-4 text-xs font-bold text-slate-500">Exam {plan.examDate} · {plan.dailyMinutes} min/day</p></Card>)}</div></section>
    </>;
}

function TodayView({ data }: { data: StudyData }) {
    const setBitStatus = useStudyStore((state) => state.setBitStatus);
    const today = new Date().toISOString().slice(0, 10);
    const todayBit = data.bits.find((bit) => bit.scheduledDate === today && bit.status !== "done") ?? data.bits.find((bit) => bit.status !== "done") ?? data.bits[0];
    const todayCards = data.cards.filter((card) => card.bitId === todayBit?.id).length;
    const todayQuestions = data.questions.filter((question) => question.bitId === todayBit?.id).length;
    const completed = data.bits.filter((bit) => bit.status === "done").length;
    return <><PageIntro eyebrow={`Today · ${todayBit?.scheduledDate ?? today}`} title="Your study session" description="One focused pass is better than an overwhelming plan. Finish this Bit, then keep your momentum." action={<Chip tone={todayBit?.status === "done" ? "green" : "blue"}><Icon name={todayBit?.status === "done" ? "check" : "clock"} /> {completed} complete</Chip>} />{todayBit && <Card className="border-primary-100 p-6 ring-2 ring-primary-50 sm:p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between"><div><Chip>{todayBit.weight === 3 ? "High focus" : "Today&apos;s Bit"}</Chip><h2 className="mt-5 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{todayBit.title}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{todayBit.content}</p><div className="mt-6 rounded-2xl bg-primary-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-primary-700">Takeaway</p><p className="mt-2 text-sm font-bold leading-6 text-primary-700">{todayBit.takeaway}</p></div></div><Chip tone={todayBit.status === "done" ? "green" : "amber"}>{todayBit.status === "done" ? "Complete" : `${todayBit.estMinutes} min`}</Chip></div><div className="mt-8 grid gap-3 sm:grid-cols-2"><Button href={`/flashcards?bit=${todayBit.id}`}><Icon name="cards" /> Practice flashcards <span className="text-primary-100">{todayCards}</span></Button><Button href={`/quiz?bit=${todayBit.id}`}><Icon name="quiz" /> Take quiz <span className="text-primary-100">{todayQuestions}</span></Button></div>{todayBit.status !== "done" && <button type="button" onClick={() => setBitStatus(todayBit.id, "done")} className="mt-4 min-h-11 w-full rounded-xl text-sm font-black text-success hover:bg-[#edf9f2]">✓ Mark Bit complete</button>}</Card>}</>;
}

function TimelineView({ data }: { data: StudyData }) {
    const today = new Date().toISOString().slice(0, 10);
    const completed = data.bits.filter((bit) => bit.status === "done").length;
    const groupedBits = data.bits.reduce<Map<string, Bit[]>>((groups, bit) => {
        const dayBits = groups.get(bit.scheduledDate) ?? [];
        dayBits.push(bit);
        groups.set(bit.scheduledDate, dayBits);
        return groups;
    }, new Map());
    const dates = [...groupedBits.keys()].sort();
    const formatDate = (date: string) => new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`));
    return <><PageIntro eyebrow="Your learning path" title="Timeline" description="See how your Bits build over time, one calm session at a time." action={<Button href="/new"><Icon name="plus" /> Add material</Button>} /><Card className="overflow-hidden"><div className="border-b border-line p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="font-black text-slate-900">{data.plan.title}</h2><p className="mt-1 text-sm text-slate-500">Exam {data.plan.examDate} · {data.bits.length} Bits</p></div><Chip tone={completed === data.bits.length ? "green" : "blue"}>{completed === data.bits.length ? "Complete" : "In progress"}</Chip></div><div className="mt-5"><ProgressBar value={data.bits.length === 0 ? 0 : Math.round((completed / data.bits.length) * 100)} label={`${completed} of ${data.bits.length} complete`} /></div></div><div>{dates.map((date) => <section key={date} className="border-b border-line last:border-b-0"><div className="bg-primary-50 px-5 py-3"><h3 className="text-sm font-black text-primary-800">{date === today ? "Today" : formatDate(date)}</h3></div><div className="divide-y divide-line">{groupedBits.get(date)?.sort((a, b) => a.order - b.order).map((bit) => { const status = bit.status === "done" ? "done" : bit.scheduledDate === today ? "today" : bit.scheduledDate < today ? "missed" : "upcoming"; return <div key={bit.id} className="flex items-center gap-4 p-5"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${status === "done" ? "bg-success text-white" : status === "today" ? "bg-primary-600 text-white" : status === "missed" ? "bg-[#fff1f1] text-error" : "bg-primary-50 text-primary-700"}`}>{status === "done" ? <Icon name="check" /> : status === "missed" ? "!" : bit.order}</span><div className="flex-1"><p className={`font-bold ${status === "done" ? "text-slate-500 line-through" : "text-slate-900"}`}>{bit.title}</p><p className="mt-1 text-xs text-slate-400">{status === "done" ? "Done" : status === "today" ? "Today" : status === "missed" ? `Missed · ${bit.scheduledDate}` : `Upcoming · ${bit.scheduledDate}`} · {bit.estMinutes} min</p></div>{status === "today" && <Chip tone="blue">Today</Chip>}{bit.weight === 3 && status !== "done" && <Chip tone="amber">Hard</Chip>}</div>; })}</div></section>)}</div></Card></>;
}

function StubView({ view, data }: { view: Exclude<View, "home" | "today" | "timeline">; data: StudyData }) {
    const content = { new: ["Add study material", `Your current plan has ${data.bits.length} Bits across the core circuit-analysis topics.`, "Start with notes"], flashcards: ["Flashcards", `Review ${data.cards.length} cards built from your circuit Bits and keep your recall active.`, "Start review"], quiz: ["Quick quiz", `Test your understanding with ${data.questions.length} questions from the current plan.`, "Begin quiz"] }[view];
    return <><PageIntro eyebrow="StudyBits" title={content[0]} description={content[1]} /><Card className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-2xl text-primary-700"><Icon name={view === "new" ? "plus" : view === "flashcards" ? "cards" : "quiz"} /></span><h2 className="mt-5 text-xl font-black text-slate-900">Your {view === "new" ? "first" : "next"} session starts here</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">This route is ready for the next product slice. The planner shell is in place.</p><Button className="mt-6">{content[2]} <Icon name="arrow" /></Button></Card></>;
}

export function StudyBitsApp({ view }: { view: View }) {
    const store = useStudyStore();
    const { bits, seed } = store;
    useEffect(() => {
        if (bits.length === 0) seed(mockData);
    }, [bits.length, seed]);

    const data: StudyData = {
        plan: store.plan ?? mockData.plan,
        plans: store.plans.length > 0 ? store.plans : [store.plan ?? mockData.plan],
        bits: bits.length > 0 ? bits : mockData.bits,
        cards: store.cards.length > 0 ? store.cards : mockData.cards,
        questions: store.questions.length > 0 ? store.questions : mockData.questions,
    };

    return <div className="min-h-screen bg-background pb-24 md:pb-8"><Header /><main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 lg:px-8 lg:py-12">{view === "home" && <HomeView data={data} />}{view === "today" && <TodayView data={data} />}{view === "timeline" && <TimelineView data={data} />}{view === "flashcards" && <Suspense fallback={<LoadingPanel title="Opening flashcards" description="Loading your study deck..." />}><FlashcardsView cards={data.cards} bits={data.bits} /></Suspense>}{view === "quiz" && <Suspense fallback={<LoadingPanel title="Opening your quiz" description="Loading your questions..." />}><QuizView questions={data.questions} bits={data.bits} /></Suspense>}{view !== "home" && view !== "today" && view !== "timeline" && view !== "flashcards" && view !== "quiz" && <StubView view={view} data={data} />}<Suspense fallback={null}><LazyGeneration bits={data.bits} cards={data.cards} questions={data.questions} /></Suspense></main><BottomTabs /></div>;
}

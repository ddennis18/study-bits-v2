"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { mockData } from "@/lib/mock";
import { useStudyStore } from "@/lib/store";
import type { Bit, Flashcard, Plan, QuizQuestion } from "@/lib/types";

type View = "home" | "new" | "today" | "timeline" | "flashcards" | "quiz";

type StudyData = {
    plan: Plan;
    bits: Bit[];
    cards: Flashcard[];
    questions: QuizQuestion[];
};

type ButtonProps = {
    children: ReactNode;
    href?: string;
    variant?: "primary" | "secondary" | "ghost";
    className?: string;
};

export function Button({ children, href, variant = "primary", className = "" }: ButtonProps) {
    const styles = {
        primary: "bg-primary-600 text-white shadow-sm shadow-primary-600/20 hover:bg-primary-700",
        secondary: "border border-primary-100 bg-white text-primary-700 hover:border-primary-600 hover:bg-primary-50",
        ghost: "text-slate-600 hover:bg-primary-50 hover:text-primary-700",
    }[variant];
    const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors ${styles} ${className}`;

    if (href) {
        return <Link href={href} className={classes}>{children}</Link>;
    }

    return <button type="button" className={classes}>{children}</button>;
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

export function Chip({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "amber" | "slate" }) {
    const styles = {
        blue: "bg-primary-50 text-primary-700",
        green: "bg-[#e8f7ef] text-success",
        amber: "bg-[#fff5df] text-[#996509]",
        slate: "bg-slate-100 text-slate-600",
    }[tone];
    return <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-bold ${styles}`}>{children}</span>;
}

function Icon({ name }: { name: "check" | "plus" | "arrow" | "spark" | "book" | "calendar" | "cards" | "quiz" | "clock" | "target" }) {
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
    const completedBits = data.bits.filter((bit) => bit.status === "done").length;
    const progress = Math.round((completedBits / data.bits.length) * 100);
    const nextBits = data.bits.filter((bit) => bit.status === "todo").slice(0, 3);
    const focusBit = nextBits[0] ?? data.bits[0];
    return <>
        <PageIntro eyebrow={`Exam ${data.plan.examDate}`} title="Good morning, Scholar" description={`A small, focused plan for today. Keep your momentum going with ${data.bits.length} Bits on electrical circuits.`} action={<Button href="/new"><Icon name="plus" /> New material</Button>} />
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
            <Card className="overflow-hidden bg-primary-700 p-6 text-white sm:p-8"><div className="flex items-start justify-between gap-4"><div><Chip tone="blue">TODAY&apos;S FOCUS</Chip><h2 className="mt-5 max-w-md text-2xl font-black leading-tight sm:text-3xl">{focusBit.title}</h2><p className="mt-3 max-w-md text-sm leading-6 text-primary-100">{focusBit.takeaway}</p></div><span className="hidden text-5xl text-accent sm:block"><Icon name="spark" /></span></div><div className="mt-8 flex items-end justify-between gap-6"><div className="w-full max-w-sm"><ProgressBar value={progress} label={`${completedBits} of ${data.bits.length} Bits complete`} /></div><Button href="/today" variant="secondary" className="shrink-0 border-transparent bg-white/95">Start Bit <Icon name="arrow" /></Button></div></Card>
            <Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Daily target</p><p className="mt-2 text-3xl font-black text-slate-900">{data.plan.dailyMinutes}<span className="text-base text-slate-400"> min</span></p></div><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff5df] text-xl text-warning"><Icon name="target" /></span></div><ProgressBar value={progress} label="Plan completion" /><div className="mt-6 grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-400">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <div key={`${day}-${index}`}><span className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full ${index < completedBits ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-400"}`}>{index < completedBits ? <Icon name="check" /> : "·"}</span>{day}</div>)}</div></Card>
        </div>
        <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black text-slate-900">Up next</h2><Link href="/today" className="text-sm font-bold text-primary-700 hover:text-primary-600">View today <Icon name="arrow" /></Link></div><div className="grid gap-3 sm:grid-cols-3">{nextBits.map((bit, index) => <Link key={bit.id} href={index === 0 ? "/today" : index === 1 ? "/flashcards" : "/quiz"} className="group rounded-2xl border border-line bg-white p-5 shadow-[0_8px_30px_rgba(0,95,146,0.04)] transition hover:-translate-y-0.5 hover:border-primary-100"><span className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl text-lg ${index === 0 ? "bg-primary-50 text-primary-700" : index === 1 ? "bg-[#e8f7ef] text-success" : "bg-[#fff5df] text-warning"}`}><Icon name={index === 0 ? "book" : index === 1 ? "cards" : "quiz"} /></span><h3 className="font-black text-slate-900 group-hover:text-primary-700">{bit.title}</h3><p className="mt-1 text-sm text-slate-500">{bit.estMinutes} min · {data.cards.filter((card) => card.bitId === bit.id).length} cards</p></Link>)}</div></section>
    </>;
}

function TodayView({ data }: { data: StudyData }) {
    const bits = data.bits.slice(0, 3);
    const completed = data.bits.filter((bit) => bit.status === "done").length;
    return <><PageIntro eyebrow={`Today · ${bits.length} Bits`} title="Your study session" description="One focused pass is better than an overwhelming plan. Take these in order." action={<Chip tone="green"><Icon name="check" /> {completed} complete</Chip>} /><div className="grid gap-4">{bits.map((bit, index) => <Card key={bit.id} className={`p-5 sm:p-6 ${index === 0 ? "border-primary-100 ring-2 ring-primary-50" : ""}`}><div className="flex gap-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${index === 0 ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700"}`}><Icon name={index === 0 ? "book" : index === 1 ? "cards" : "quiz"} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-black text-slate-900">{bit.title}</h2><Chip tone={bit.status === "done" ? "green" : index === 1 ? "amber" : "slate"}>{bit.status === "done" ? "Complete" : index === 1 ? "Next up" : "Locked"}</Chip></div><p className="mt-2 text-sm leading-6 text-slate-500">{bit.content}</p>{index === 0 && <div className="mt-4"><ProgressBar value={bit.status === "done" ? 100 : 42} label="Bit progress" /></div>}{index < 2 && <Button href={index === 0 ? "/today" : "/flashcards"} variant={index === 0 ? "primary" : "secondary"} className="mt-5">{bit.status === "done" ? "Review Bit" : "Preview Bit"}<Icon name="arrow" /></Button>}</div></div></Card>)}</div></>;
}

function TimelineView({ data }: { data: StudyData }) {
    const completed = data.bits.filter((bit) => bit.status === "done").length;
    return <><PageIntro eyebrow="Your learning path" title="Timeline" description="See how your Bits build over time, one calm session at a time." action={<Button href="/new"><Icon name="plus" /> Add material</Button>} /><Card className="overflow-hidden"><div className="border-b border-line p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-black text-slate-900">Electrical Circuits</h2><p className="mt-1 text-sm text-slate-500">Exam {data.plan.examDate} · {data.bits.length} Bits</p></div><Chip tone="blue">In progress</Chip></div><div className="mt-5"><ProgressBar value={Math.round((completed / data.bits.length) * 100)} label={`${completed} of ${data.bits.length} complete`} /></div></div><div className="divide-y divide-line">{data.bits.map((bit) => <div key={bit.id} className="flex items-center gap-4 p-5"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${bit.status === "done" ? "bg-success text-white" : "bg-primary-50 text-primary-700"}`}>{bit.status === "done" ? <Icon name="check" /> : bit.order}</span><div className="flex-1"><p className={`font-bold ${bit.status === "done" ? "text-slate-500 line-through" : "text-slate-900"}`}>{bit.title}</p><p className="mt-1 text-xs text-slate-400">{bit.status === "done" ? "Completed" : `${bit.scheduledDate} · ${bit.estMinutes} min`}</p></div>{bit.weight === 3 && <Chip tone="amber">Hard</Chip>}</div>)}</div></Card></>;
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
        bits: bits.length > 0 ? bits : mockData.bits,
        cards: store.cards.length > 0 ? store.cards : mockData.cards,
        questions: store.questions.length > 0 ? store.questions : mockData.questions,
    };

    return <div className="min-h-screen bg-background pb-24 md:pb-8"><Header /><main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 lg:px-8 lg:py-12">{view === "home" && <HomeView data={data} />}{view === "today" && <TodayView data={data} />}{view === "timeline" && <TimelineView data={data} />}{view !== "home" && view !== "today" && view !== "timeline" && <StubView view={view} data={data} />}</main><BottomTabs /></div>;
}

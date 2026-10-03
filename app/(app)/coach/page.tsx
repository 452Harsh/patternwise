"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Loader2, MessageCircleQuestion, RefreshCw, Sparkles, Timer, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, Panel, Shimmer } from "@/components/kit";
import { NativeSelect } from "@/components/native-select";
import { ModelStatus, useCoachStatus } from "@/components/coach/coach-kit";
import { ModulePlanCard } from "@/components/coach/plan-card";
import { prefsOf } from "@/lib/coach/plan";
import type { CoachPlan, CoachPrefs } from "@/lib/coach/types";
import { greeting } from "@/lib/format";
import { syncNow, today, updateSettings, useHydrated, useStore } from "@/lib/progress";

interface Saved {
  plan: CoachPlan | null;
  explanations: Partial<Record<"dsa" | "sd", string>>;
}

export default function CoachTodayPage() {
  const state = useStore();
  const hydrated = useHydrated();
  const { status, refresh } = useCoachStatus();
  const [saved, setSaved] = useState<Saved | null>(null);
  const [generating, setGenerating] = useState(false);
  const [fresh, setFresh] = useState(false);
  const date = today();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/coach/plan?date=${date}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { plan: null, explanations: {} }))
      .then((d: Saved) => !cancelled && setSaved(d))
      .catch(() => !cancelled && setSaved({ plan: null, explanations: {} }));
    return () => {
      cancelled = true;
    };
  }, [date]);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      await syncNow();
      const res = await fetch("/api/coach/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ date }) });
      if (!res.ok) throw new Error(`Couldn't build the plan (${res.status})`);
      setSaved(await res.json());
      setFresh(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't build the plan");
    } finally {
      setGenerating(false);
    }
  }, [date]);

  if (!hydrated || !saved) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Loading your coach">
        <Shimmer className="h-9 w-80" />
        <Shimmer className="h-20 w-full rounded-xl" />
        <div className="grid gap-6 xl:grid-cols-2">
          <Shimmer className="h-[520px] rounded-xl" />
          <Shimmer className="h-[520px] rounded-xl" />
        </div>
      </div>
    );
  }

  const prefs = prefsOf(state);
  const setPrefs = (patch: Partial<CoachPrefs>) => updateSettings({ coach: { ...prefs, ...patch } });
  const plan = saved.plan;
  const name = state.settings.name;
  const modules = plan ? [plan.dsa, plan.sd].filter((m) => m !== null) : [];
  const prefsChanged = plan && JSON.stringify(plan.prefs) !== JSON.stringify(prefs);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden /> AI Coach
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting()}
            {name ? `, ${name}` : ""} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">What should you practise today? Your plan comes from your real attempts, ratings and reviews.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModelStatus status={status} onIndexed={refresh} />
        </div>
      </header>

      <Panel className="p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="c-min">Time available</Label>
            <NativeSelect id="c-min" value={prefs.minutes} onChange={(e) => setPrefs({ minutes: Number(e.target.value) })}>
              {[30, 45, 60, 90, 120, 180, 240].map((m) => (
                <option key={m} value={m}>
                  {m < 60 ? `${m} min` : `${m / 60} h`.replace(".5 h", "½ h")}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-focus">Focus</Label>
            <NativeSelect id="c-focus" value={prefs.focus} onChange={(e) => setPrefs({ focus: e.target.value as CoachPrefs["focus"] })}>
              <option value="balanced">DSA + System Design</option>
              <option value="dsa">DSA only</option>
              <option value="sd">System Design only</option>
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-diff">Difficulty</Label>
            <NativeSelect id="c-diff" value={prefs.difficulty} onChange={(e) => setPrefs({ difficulty: e.target.value as CoachPrefs["difficulty"] })}>
              <option value="auto">Adaptive</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-target">Problems / day</Label>
            <NativeSelect id="c-target" value={prefs.dailyProblems} onChange={(e) => setPrefs({ dailyProblems: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-date">Interview date</Label>
            <Input id="c-date" type="date" value={prefs.interviewDate ?? ""} min={date} onChange={(e) => setPrefs({ interviewDate: e.target.value || undefined })} className="h-8" />
          </div>
          <Button onClick={generate} disabled={generating} className="col-span-2 sm:col-span-1">
            {generating ? <Loader2 data-icon="inline-start" className="animate-spin" /> : plan ? <RefreshCw data-icon="inline-start" /> : <Wand2 data-icon="inline-start" />}
            {plan ? "Regenerate" : "Generate today's plan"}
          </Button>
        </div>
        {(plan?.interviewDaysLeft != null || prefsChanged) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
            {plan?.interviewDaysLeft != null && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-3.5 text-warning" aria-hidden />
                Interview in <span className="font-mono text-foreground">{plan.interviewDaysLeft}</span> day{plan.interviewDaysLeft === 1 ? "" : "s"}
              </span>
            )}
            {prefsChanged && <span>Preferences changed: regenerate to apply them.</span>}
          </div>
        )}
      </Panel>

      {!plan ? (
        <EmptyState
          icon={Wand2}
          title="Your plan for today isn't generated yet"
          description="The coach analyses every attempt, hint, failure, rating and review you've logged, picks what matters most, and explains why."
          action={
            <Button onClick={generate} disabled={generating}>
              {generating ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Wand2 data-icon="inline-start" />}
              Generate today&apos;s plan
            </Button>
          }
        />
      ) : modules.length === 0 ? (
        <EmptyState icon={Sparkles} title="Nothing to plan yet" description="Log a few attempts or ratings first; the coach needs data to work with." />
      ) : (
        <div className={modules.length > 1 ? "grid items-start gap-6 xl:grid-cols-2" : "mx-auto max-w-3xl"}>
          {modules.map((m) => (
            <ModulePlanCard key={`${m.module}-${plan.generatedAt}`} plan={m} date={plan.date} explanation={saved.explanations[m.module]} autoExplain={fresh && status?.ok === true} />
          ))}
        </div>
      )}

      <section aria-label="More from the coach" className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/coach/ask", icon: MessageCircleQuestion, title: "Ask coach", text: "“Why do I keep struggling with…?” answered from your history." },
          { href: "/coach/interview", icon: Timer, title: "Interview mode", text: "An interviewer that asks follow-ups instead of teaching." },
          { href: "/coach/weak-areas", icon: Sparkles, title: "My weak areas", text: "Every signal behind your priorities, in one place." },
        ].map((x) => (
          <Link key={x.href} href={x.href} className={buttonVariants({ variant: "outline", className: "h-auto w-full min-w-0 shrink flex-col items-start gap-1 p-4 text-left whitespace-normal" })}>
            <span className="flex items-center gap-2 font-medium">
              <x.icon className="size-4 text-primary" aria-hidden /> {x.title}
            </span>
            <span className="text-xs font-normal text-muted-foreground">{x.text}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

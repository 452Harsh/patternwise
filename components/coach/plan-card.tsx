"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Ban, CircleCheck, Circle, Clock, Hand, RefreshCw, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/kit";
import { TrackTag } from "@/components/sd/sd-kit";
import type { ModulePlan, PlanStep } from "@/lib/coach/types";
import { toggleDaily, useStore, type State } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { CoachMarkdown, PriorityBadge, SourceFooter, StopButton, Thinking, useCoachStream } from "./coach-kit";

/** Done if the user actually practised it today (attempt or rating logged), or ticked it. */
function stepDone(state: State, date: string, s: PlanStep): { done: boolean; auto: boolean } {
  if (s.slug && state.problems[s.slug]?.history.some((h) => h.date === date)) return { done: true, auto: true };
  if (s.sdKey && state.sd[s.sdKey]?.history.some((h) => h.date === date)) return { done: true, auto: true };
  return { done: !!state.daily[date]?.[`coach:${s.id}`], auto: false };
}

export function ModulePlanCard({
  plan,
  date,
  explanation,
  autoExplain,
}: {
  plan: ModulePlan;
  date: string;
  explanation?: string;
  autoExplain: boolean;
}) {
  const state = useStore();
  const ai = useCoachStream();
  const started = useRef(false);
  const [shown, setShown] = useState(explanation ?? "");
  const { run } = ai;

  useEffect(() => {
    if (!autoExplain || explanation || started.current) return;
    started.current = true;
    void run({ ctx: plan.module, mode: "plan", messages: [] }).then((t) => t && setShown(t));
  }, [autoExplain, explanation, plan.module, run]);

  const explain = async () => {
    const t = await ai.run({ ctx: plan.module, mode: "plan", messages: [] });
    if (t) setShown(t);
  };

  const total = plan.steps.reduce((a, s) => a + s.minutes, 0);
  const statuses = plan.steps.map((s) => stepDone(state, date, s));
  const doneCount = statuses.filter((s) => s.done).length;
  const text = ai.streaming || ai.text ? ai.text : shown;

  return (
    <Panel className="flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrackTag track={plan.module === "dsa" ? "dsa" : "hld"} />
          <span className="text-sm font-semibold">{plan.module === "dsa" ? "DSA" : "System Design"}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden /> {total} min · {doneCount}/{plan.steps.length} done
        </span>
      </div>

      <div>
        <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <Target className="size-3.5" aria-hidden /> Main focus
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-semibold tracking-tight">{plan.focusTitle}</h3>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{plan.actionLabel}</span>
          {plan.priority !== null && plan.level && <PriorityBadge priority={plan.priority} level={plan.level} signals={plan.signals} />}
        </div>
      </div>

      {plan.stopMessage && (
        <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
          <Hand className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <p>{plan.stopMessage}</p>
        </div>
      )}

      {plan.why.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Why?</p>
          <ul className="mt-1.5 space-y-1 text-sm">
            {plan.why.map((w) => (
              <li key={w} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-muted-foreground">Today&apos;s plan</p>
        <ol className="mt-2 space-y-1.5">
          {plan.steps.map((s, i) => {
            const st = statuses[i];
            return (
              <li key={s.id} className={cn("flex items-start gap-3 rounded-lg border bg-surface p-3", st.done && "opacity-70")}>
                <button
                  type="button"
                  disabled={st.auto}
                  onClick={() => toggleDaily(date, `coach:${s.id}`, !st.done)}
                  aria-label={st.done ? `Mark “${s.label}” not done` : `Mark “${s.label}” done`}
                  title={st.auto ? "Done: you logged practice for this today" : undefined}
                  className="mt-0.5 shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
                >
                  {st.done ? <CircleCheck className="size-5 text-success" aria-hidden /> : <Circle className="size-5 text-muted-foreground" aria-hidden />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn("text-sm font-medium", st.done && "line-through decoration-muted-foreground/60")}>
                      <span className="mr-1.5 font-mono text-xs text-muted-foreground">{i + 1}.</span>
                      {s.label}
                    </p>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{s.minutes}m</span>
                  </div>
                  {s.detail && <p className="mt-0.5 text-xs text-muted-foreground">{s.detail}</p>}
                  {s.href && (
                    <Link href={s.href} className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      Open <ArrowRight className="size-3" aria-hidden />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {(plan.after || plan.avoid.length > 0) && (
        <div className="grid gap-3 @container sm:grid-cols-2">
          {plan.after && (
            <Link href={plan.after.href} className="rounded-lg border bg-surface p-3 text-sm outline-none hover:border-foreground/15 focus-visible:ring-2 focus-visible:ring-ring">
              <p className="text-xs font-semibold text-muted-foreground">After today&apos;s session</p>
              <p className="mt-1 font-medium">{plan.after.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{plan.after.reason}</p>
            </Link>
          )}
          {plan.avoid.length > 0 && (
            <div className="rounded-lg border bg-surface p-3 text-sm">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Ban className="size-3.5" aria-hidden /> Avoid for now
              </p>
              <ul className="mt-1 space-y-1 text-xs">
                {plan.avoid.slice(0, 3).map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" aria-hidden /> Coach&apos;s take
          </p>
          {ai.streaming ? (
            <StopButton onClick={ai.stop} />
          ) : (
            <Button variant="ghost" size="sm" onClick={explain}>
              <RefreshCw data-icon="inline-start" /> {text ? "Re-explain" : "Explain my plan"}
            </Button>
          )}
        </div>
        {ai.error && <p className="text-sm text-destructive">{ai.error}</p>}
        {text ? <CoachMarkdown>{text}</CoachMarkdown> : ai.streaming ? <Thinking label="Reading your progress" /> : !ai.error && <p className="text-sm text-muted-foreground">The open-weight model explains why this plan fits you, using only your logged data.</p>}
        {!ai.streaming && ai.meta && <SourceFooter meta={ai.meta} />}
      </div>
    </Panel>
  );
}

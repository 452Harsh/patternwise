"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, CircleCheck, Timer } from "lucide-react";
import { DailyPlan } from "@/components/daily-plan";
import { Meter, PageHeader, Panel, SectionTitle, Shimmer, masteryTone, pct } from "@/components/kit";
import { SDStatusBadge, TrackTag } from "@/components/sd/sd-kit";
import { buildDailyPlan } from "@/lib/plan";
import { replacePlan, today, useHydrated, useStore } from "@/lib/progress";
import { categoryStats, currentSDPhase, sdPhaseProgress } from "@/lib/sd";
import { cn } from "@/lib/utils";

export default function SDStudyPlanPage() {
  const state = useStore();
  const hydrated = useHydrated();
  const phases = sdPhaseProgress(state);
  const currentIdx = hydrated ? currentSDPhase(state) : 0;
  const [open, setOpen] = useState<string | null>(null);
  const openId = open ?? phases[currentIdx]?.phase.id;
  const cats = new Map([...categoryStats(state, "hld"), ...categoryStats(state, "lld")].map((c) => [c.category.id, c]));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="System Design"
        title="Study Plan"
        subtitle="Five phases from distributed-systems fundamentals and OOP basics to full design interviews."
      />

      <section aria-labelledby="sd-plan-today">
        <SectionTitle id="sd-plan-today" hint="A concept to learn or revise, a design pattern, and a design problem each day.">
          Today
        </SectionTitle>
        <DailyPlan tracks={["hld", "lld"]} />
        {hydrated && (
          <button
            type="button"
            className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={() => replacePlan(today(), buildDailyPlan(state))}
          >
            Regenerate today&apos;s plan
          </button>
        )}
      </section>

      <section aria-labelledby="sd-roadmap" className="space-y-3">
        <SectionTitle id="sd-roadmap" hint="Move on once a phase is around 60% complete.">
          Roadmap
        </SectionTitle>
        <ol className="space-y-3">
          {phases.map(({ phase, items, value, started }, i) => {
            const isOpen = openId === phase.id;
            const done = value >= 0.6;
            const current = hydrated && i === currentIdx;
            return (
              <li key={phase.id}>
                <Panel className={cn("overflow-hidden", current && "border-primary/40")}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? "" : phase.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 p-4 text-left outline-none hover:bg-muted/30 focus-visible:bg-muted/40"
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full border font-mono text-sm font-semibold",
                        done ? "border-success/40 bg-success/10 text-success" : current ? "border-primary/50 bg-primary/10 text-primary" : "text-muted-foreground",
                      )}
                    >
                      {done ? <CircleCheck className="size-4" aria-label="Complete" /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Phase {i + 1}</span>
                        {current && <span className="rounded bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">CURRENT</span>}
                      </span>
                      <span className="block font-medium">{phase.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{phase.summary}</span>
                    </span>
                    <span className="hidden w-40 sm:block">
                      <span className="mb-1 flex justify-between font-mono text-[11px] text-muted-foreground">
                        <span>
                          {hydrated ? started : 0}/{items.length}
                        </span>
                        <span>{hydrated ? pct(value) : "—"}</span>
                      </span>
                      <Meter value={hydrated ? value : 0} tone={done ? "success" : "primary"} label={`${phase.name} progress`} />
                    </span>
                    <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
                  </button>
                  {isOpen && (
                    <div className="border-t p-4">
                      {phase.categories.length ? (
                        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {phase.categories.map((id) => {
                            const c = cats.get(id);
                            if (!c) return null;
                            return (
                              <li key={id}>
                                <Link
                                  href={`/system-design/${c.category.track}#${id}`}
                                  className="flex items-center gap-3 rounded-lg border bg-surface p-3 outline-none transition-colors hover:border-foreground/15 focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  <TrackTag track={c.category.track} />
                                  <span className="min-w-0 flex-1">
                                    <span className="mb-1 flex justify-between text-sm">
                                      <span className="truncate">{c.category.name}</span>
                                      <span className="font-mono text-xs text-muted-foreground">
                                        {c.completed}/{c.total}
                                      </span>
                                    </span>
                                    <Meter value={c.mastery} tone={masteryTone(c.mastery)} label={`${c.category.name} mastery`} />
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <>
                          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                            {items.map((x) => (
                              <li key={x.key}>
                                <Link href={x.href} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                                  <SDStatusBadge entry={state.sd[x.key]} compact />
                                  <span className="min-w-0 flex-1 truncate">{x.title}</span>
                                  <TrackTag track={x.track} />
                                </Link>
                              </li>
                            ))}
                          </ul>
                          {phase.id === "practice" && (
                            <Link href="/system-design/interview" className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                              <Timer className="size-4" aria-hidden /> Run a timed interview session
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </Panel>
              </li>
            );
          })}
        </ol>
        {!hydrated && <Shimmer className="h-4 w-48" />}
      </section>
    </div>
  );
}

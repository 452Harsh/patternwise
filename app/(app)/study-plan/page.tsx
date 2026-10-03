"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleCheck, ChevronDown, Flag, Presentation, Timer } from "lucide-react";
import { DailyPlan } from "@/components/daily-plan";
import { Meter, PageHeader, Panel, SectionTitle, Shimmer, masteryTone, pct } from "@/components/kit";
import { NativeSelect } from "@/components/native-select";
import { TopicIcon } from "@/components/topic-icon";
import { IMPORTANT } from "@/data/important";
import { replacePlan, today, updateSettings, useHydrated, useStore } from "@/lib/progress";
import { buildDailyPlan } from "@/lib/plan";
import { currentPhaseIndex, phaseProgress, topicStat } from "@/lib/stats";
import { cn } from "@/lib/utils";

export default function StudyPlanPage() {
  const state = useStore();
  const hydrated = useHydrated();
  const phases = phaseProgress(state);
  const currentIdx = hydrated ? currentPhaseIndex(state) : 0;
  const [open, setOpen] = useState<string | null>(null);
  const openId = open ?? phases[currentIdx]?.phase.id;

  const timed = Object.values(state.problems).flatMap((e) => e.history).filter((h) => h.durationSec).length;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Study Plan"
        subtitle="Five phases from fundamentals to interview-ready. Finish a phase to ~80% before leaning on the next."
      />

      <section aria-labelledby="today">
        <SectionTitle
          id="today"
          hint="Built from your current phase, weakest pattern and failed problems."
          action={
            hydrated && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                New problems / day
                <NativeSelect
                  value={state.settings.dailyNew}
                  onChange={(e) => updateSettings({ dailyNew: Number(e.target.value) })}
                  aria-label="New problems per day"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </NativeSelect>
              </label>
            )
          }
        >
          Today
        </SectionTitle>
        <DailyPlan tracks={["dsa"]} />
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

      <section aria-labelledby="phases" className="space-y-3">
        <SectionTitle id="phases" hint="Progress = share of the phase's problems solved.">
          Roadmap
        </SectionTitle>
        <ol className="space-y-3">
          {phases.map(({ phase, topics, solved, total, value }, i) => {
            const isOpen = openId === phase.id;
            const done = value >= 0.8;
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
                          {hydrated ? solved : 0}/{total}
                        </span>
                        <span>{hydrated ? pct(value) : "—"}</span>
                      </span>
                      <Meter value={hydrated ? value : 0} tone={done ? "success" : "primary"} label={`${phase.name} progress`} />
                    </span>
                    <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
                  </button>
                  {isOpen && (
                    <div className="border-t p-4">
                      {topics.length ? (
                        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {topics.map((t) => {
                            const s = topicStat(t, state.problems);
                            return (
                              <li key={t.id}>
                                <Link
                                  href={`/topics/${t.id}`}
                                  className="flex items-center gap-3 rounded-lg border bg-surface p-3 outline-none transition-colors hover:border-foreground/15 focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  <TopicIcon id={t.id} className="size-8" />
                                  <span className="min-w-0 flex-1">
                                    <span className="mb-1 flex justify-between text-sm">
                                      <span className="truncate">{t.name}</span>
                                      <span className="font-mono text-xs text-muted-foreground">
                                        {s.solved}/{s.total}
                                      </span>
                                    </span>
                                    <Meter value={s.total ? s.solved / s.total : 0} tone={masteryTone(s.mastery)} label={`${t.name} progress`} />
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <PhaseFive
                            icon={Flag}
                            title="Mixed essentials"
                            value={`${hydrated ? solved : 0}/${IMPORTANT.length}`}
                            href="/problems?only=essentials"
                            hint="Canonical problem per pattern"
                          />
                          <PhaseFive icon={Timer} title="Timed practice" value={String(hydrated ? timed : 0)} href="/interview#timed" hint="Attempts logged with a time" />
                          <PhaseFive
                            icon={Presentation}
                            title="Mock interviews"
                            value={`${hydrated ? state.mocks.length : 0}/${state.settings.mockTarget}`}
                            href="/interview#mocks"
                            hint="Log each mock you do"
                          />
                        </ul>
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

function PhaseFive({ icon: Icon, title, value, href, hint }: { icon: typeof Flag; title: string; value: string; href: string; hint: string }) {
  return (
    <li>
      <Link href={href} className="block rounded-lg border bg-surface p-3 outline-none transition-colors hover:border-foreground/15 focus-visible:ring-2 focus-visible:ring-ring">
        <Icon className="size-4 text-primary" aria-hidden />
        <p className="mt-2 text-sm font-medium">{title}</p>
        <p className="font-mono text-lg font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </Link>
    </li>
  );
}

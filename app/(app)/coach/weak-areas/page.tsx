"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { Hand, Sparkles, Trophy } from "lucide-react";
import { EmptyState, PageHeader, Panel, SectionTitle, Shimmer } from "@/components/kit";
import { CtxSwitch, PriorityBadge, useCoachCtx } from "@/components/coach/coach-kit";
import { TrackTag } from "@/components/sd/sd-kit";
import { analyzeDSA } from "@/lib/coach/dsa";
import { interviewDaysLeft, prefsOf } from "@/lib/coach/plan";
import { analyzeSD } from "@/lib/coach/sd";
import { DSA_ACTION_LABEL, SD_ACTION_LABEL } from "@/lib/coach/types";
import { today, useHydrated, useStore } from "@/lib/progress";

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);
const ago = (d: number | null) => (d === null ? "never" : d === 0 ? "today" : `${d}d ago`);

function Stat({ label, value, warn }: { label: string; value: React.ReactNode; warn?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={warn ? "font-mono text-sm text-warning" : "font-mono text-sm"}>{value}</p>
    </div>
  );
}

function WeakAreas() {
  const state = useStore();
  const hydrated = useHydrated();
  const [ctx, setCtx] = useCoachCtx();

  const data = useMemo(() => {
    if (!hydrated) return null;
    const date = today();
    const prefs = prefsOf(state);
    const left = interviewDaysLeft(prefs, date);
    return ctx === "dsa" ? { dsa: analyzeDSA(state, date, prefs, left) } : { sd: analyzeSD(state, date, left) };
  }, [hydrated, state, ctx]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" aria-hidden /> AI Coach
          </span>
        }
        title="My weak areas"
        subtitle="Every priority is computed from your attempts, hints, failures, ratings and reviews. Open the score to see how."
        actions={<CtxSwitch ctx={ctx} onChange={setCtx} />}
      />

      {!data ? (
        <Shimmer className="h-96 w-full rounded-xl" />
      ) : data.dsa ? (
        <>
          <section>
            <SectionTitle hint="Highest practice priority first.">Needs attention</SectionTitle>
            {data.dsa.ranked.length === 0 ? (
              <EmptyState icon={Sparkles} title="No practice logged yet" description="Solve or attempt a few problems and your weak areas appear here." action={<Link href="/problems" className="text-sm font-medium text-primary hover:underline">Browse problems →</Link>} />
            ) : (
              <ul className="space-y-2">
                {data.dsa.ranked.slice(0, 12).map((r) => (
                  <li key={r.patternId}>
                    <Panel className="p-4">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <div className="min-w-0 xl:w-72">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/patterns/${r.patternId}`} className="font-medium hover:text-primary">
                              {r.patternName}
                            </Link>
                            {r.stopSolving && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-warning">
                                <Hand className="size-3" aria-hidden /> Review first
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {r.topicName} · {DSA_ACTION_LABEL[r.action]}
                          </p>
                        </div>
                        <div className="grid flex-1 grid-cols-3 gap-3 sm:grid-cols-6">
                          <Stat label="Solved" value={`${r.facts.solved}/${r.facts.total}`} />
                          <Stat label="Success (21d)" value={pct(r.facts.recentSuccess)} warn={(r.facts.recentSuccess ?? 1) < 0.5} />
                          <Stat label="Failed / hints" value={`${r.facts.recentFails} / ${r.facts.recentHints}`} warn={r.facts.recentFails + r.facts.recentHints >= 2} />
                          <Stat label="Confidence" value={r.facts.avgConfidence?.toFixed(1) ?? "—"} warn={(r.facts.avgConfidence ?? 5) < 3} />
                          <Stat label="Due" value={r.facts.due} warn={r.facts.due > 0} />
                          <Stat label="Last practised" value={ago(r.facts.daysSince)} warn={(r.facts.daysSince ?? 0) >= 10} />
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <PriorityBadge priority={r.priority} level={r.level} signals={r.signals} />
                          <Link href={`/coach/ask?ctx=dsa&tool=explain&pattern=${r.patternId}`} className="text-xs font-medium text-primary hover:underline">
                            Explain it back
                          </Link>
                        </div>
                      </div>
                    </Panel>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel className="p-5">
              <SectionTitle hint="Clean recent attempts and high confidence.">
                <span className="inline-flex items-center gap-1.5">
                  <Trophy className="size-4 text-success" aria-hidden /> Strong areas
                </span>
              </SectionTitle>
              {data.dsa.strong.length ? (
                <ul className="space-y-1.5 text-sm">
                  {data.dsa.strong.map((f) => (
                    <li key={f.patternId} className="flex justify-between gap-3">
                      <Link href={`/patterns/${f.patternId}`} className="truncate hover:text-primary">
                        {f.patternName}
                      </Link>
                      <span className="font-mono text-xs text-muted-foreground">
                        {f.solved}/{f.total} · {f.avgConfidence?.toFixed(1)}/5
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">None yet: a pattern counts as strong after 3+ solves at 85%+ success and 4+ confidence.</p>
              )}
            </Panel>
            <Panel className="p-5">
              <SectionTitle hint="Next in your study order.">Not started yet</SectionTitle>
              <p className="mb-2 text-xs text-muted-foreground">{data.dsa.profile.corePatternsUntouched} core interview patterns haven&apos;t been started.</p>
              <ul className="space-y-1.5 text-sm">
                {data.dsa.learn.map((r) => (
                  <li key={r.patternId} className="flex justify-between gap-3">
                    <Link href={`/patterns/${r.patternId}`} className="truncate hover:text-primary">
                      {r.patternName}
                    </Link>
                    <span className="text-xs text-muted-foreground">{r.topicName}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      ) : (
        <>
          <section>
            <SectionTitle hint="Highest practice priority first.">Needs attention</SectionTitle>
            {data.sd!.ranked.length === 0 ? (
              <EmptyState icon={Sparkles} title="Nothing rated yet" description="Rate a few concepts or practise a design and your weak areas appear here." action={<Link href="/system-design/concepts" className="text-sm font-medium text-primary hover:underline">Browse concepts →</Link>} />
            ) : (
              <ul className="space-y-2">
                {data.sd!.ranked.slice(0, 12).map((r) => (
                  <li key={r.key}>
                    <Panel className="p-4">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <div className="min-w-0 xl:w-72">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={r.href} className="font-medium hover:text-primary">
                              {r.title}
                            </Link>
                            <TrackTag track={r.track} />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {r.facts.group} · {SD_ACTION_LABEL[r.action]}
                          </p>
                        </div>
                        <div className="grid flex-1 grid-cols-3 gap-3 sm:grid-cols-5">
                          <Stat label="Rating" value={r.facts.confidence ? `${r.facts.confidence}/5` : "—"} warn={r.facts.confidence > 0 && r.facts.confidence <= 2} />
                          <Stat label="Reviews" value={r.facts.reviewCount} />
                          <Stat label="Applied" value={r.facts.linkedProblems ? `${r.facts.linkedPracticed}/${r.facts.linkedProblems}` : "—"} warn={r.facts.linkedProblems > 0 && r.facts.linkedPracticed === 0} />
                          <Stat label="Due" value={r.facts.due ? "yes" : "no"} warn={r.facts.due} />
                          <Stat label="Last reviewed" value={ago(r.facts.daysSince)} warn={(r.facts.daysSince ?? 0) >= 14} />
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <PriorityBadge priority={r.priority} level={r.level} signals={r.signals} />
                          {r.kind !== "problem" && (
                            <Link href={`/coach/ask?ctx=sd&tool=explain&item=${encodeURIComponent(r.key)}`} className="text-xs font-medium text-primary hover:underline">
                              Explain it back
                            </Link>
                          )}
                        </div>
                      </div>
                    </Panel>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel className="p-5">
              <SectionTitle hint="Rated 4+ on the last two reviews.">
                <span className="inline-flex items-center gap-1.5">
                  <Trophy className="size-4 text-success" aria-hidden /> Strong areas
                </span>
              </SectionTitle>
              {data.sd!.strong.length ? (
                <ul className="space-y-1.5 text-sm">
                  {data.sd!.strong.map((f) => (
                    <li key={f.key} className="flex justify-between gap-3">
                      <span className="truncate">{f.title}</span>
                      <span className="font-mono text-xs text-muted-foreground">{f.confidence}/5</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">None yet.</p>
              )}
            </Panel>
            <Panel className="p-5">
              <SectionTitle hint="Next on your roadmap.">Not started yet</SectionTitle>
              <ul className="space-y-1.5 text-sm">
                {data.sd!.learn.map((r) => (
                  <li key={r.key} className="flex items-center justify-between gap-3">
                    <Link href={r.href} className="truncate hover:text-primary">
                      {r.title}
                    </Link>
                    <TrackTag track={r.track} />
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

export default function WeakAreasPage() {
  return (
    <Suspense fallback={<Shimmer className="h-96 w-full rounded-xl" />}>
      <WeakAreas />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BarChart3, Flame, Trophy } from "lucide-react";
import { ActivityCalendar, DifficultyDonut, InView, PatternHeatmap, SolvedOverTime, TopicBars } from "@/components/charts";
import { Coverage } from "@/components/coverage";
import { EmptyState, Meter, PageHeader, Panel, Ring, SectionTitle, Shimmer, masteryTone, pct } from "@/components/kit";
import { UrlTabs } from "@/components/url-tabs";
import { allProblems } from "@/data/curriculum";
import { useHydrated, useStore } from "@/lib/progress";
import { activityByDay, difficultySplit, firstSolvesByDay, overview, phaseProgress, streaks } from "@/lib/stats";

type Tab = "progress" | "analytics" | "coverage";
const TABS: [Tab, string][] = [
  ["progress", "Progress"],
  ["analytics", "Analytics"],
  ["coverage", "Coverage & gaps"],
];

export default function ProgressPage() {
  return (
    <Suspense>
      <ProgressInner />
    </Suspense>
  );
}

function ProgressInner() {
  const hydrated = useHydrated();
  const params = useSearchParams();
  const requested = params.get("tab");
  // "dsa" was the old name of the analytics tab.
  const tab: Tab = requested === "analytics" || requested === "dsa" ? "analytics" : requested === "coverage" ? "coverage" : "progress";

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="DSA" title={tab === "analytics" ? "Analytics" : "Progress"} subtitle="Useful numbers, not vanity metrics: where you're strong, where to push next." />
      <UrlTabs base="/progress" tabs={TABS} active={tab} label="DSA progress views" />

      {!hydrated ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Panel key={i} className="space-y-3 p-5">
              <Shimmer className="h-4 w-40" />
              <Shimmer className="h-48 w-full" />
            </Panel>
          ))}
        </div>
      ) : tab === "coverage" ? (
        <Coverage />
      ) : tab === "analytics" ? (
        <Analytics />
      ) : (
        <DSAProgress />
      )}
    </div>
  );
}

/** DSA preparation at a glance: five tracks, readiness, study phases and topic mastery. */
function DSAProgress() {
  const state = useStore();
  const o = overview(state);
  const phases = phaseProgress(state);
  const parts = [
    { label: "Interview essentials solved", value: o.readinessParts.essentials, weight: "35%" },
    { label: "Core pattern mastery", value: o.readinessParts.coreMastery, weight: "35%" },
    { label: "Essentials revised & not overdue", value: o.readinessParts.revisionHealth, weight: "15%" },
    { label: "Mock interviews vs target", value: o.readinessParts.mocks, weight: "15%" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <SectionTitle hint="Topics, patterns, problems, revision and mock interviews, weighted equally.">DSA preparation</SectionTitle>
          <div className="flex items-center gap-5">
            <Ring value={o.preparation} size={104} label={`DSA preparation ${pct(o.preparation)}`}>
              <span className="font-mono text-2xl font-semibold">{pct(o.preparation)}</span>
            </Ring>
            <ul className="min-w-0 flex-1 space-y-2.5">
              {o.segments.map((seg) => (
                <li key={seg.key}>
                  <div className="mb-0.5 flex justify-between gap-2 text-xs">
                    <span className="font-medium">{seg.label}</span>
                    <span className="truncate font-mono text-muted-foreground">{seg.detail}</span>
                  </div>
                  <Meter value={seg.value} label={seg.label} />
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        <Panel className="p-5">
          <SectionTitle hint="A weighted score from your own DSA data.">Interview readiness</SectionTitle>
          <div className="flex items-center gap-5">
            <Ring value={o.readiness} size={104} tone="success" label={`Interview readiness ${pct(o.readiness)}`}>
              <span className="font-mono text-2xl font-semibold">{pct(o.readiness)}</span>
            </Ring>
            <ul className="min-w-0 flex-1 space-y-2.5">
              {parts.map((p) => (
                <li key={p.label}>
                  <div className="mb-0.5 flex justify-between gap-2 text-xs">
                    <span className="truncate text-muted-foreground">{p.label}</span>
                    <span className="font-mono">{p.weight}</span>
                  </div>
                  <Meter value={p.value} tone="success" label={p.label} />
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionTitle hint="Share of each phase's problems solved." action={<Link href="/study-plan" className="text-xs text-muted-foreground hover:text-foreground">Study plan →</Link>}>
          Study phases
        </SectionTitle>
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {phases.map(({ phase, value }, i) => (
            <li key={phase.id} className="rounded-lg border bg-surface p-3">
              <p className="font-mono text-[10px] text-muted-foreground">PHASE {i + 1}</p>
              <p className="mt-0.5 truncate text-sm font-medium" title={phase.name}>
                {phase.name}
              </p>
              <Meter value={value} tone={value >= 0.8 ? "success" : "primary"} className="mt-2" label={`${phase.name} progress`} />
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">{pct(value)}</p>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel className="p-5">
        <SectionTitle hint="Mastery per topic, in study order.">Topic mastery</SectionTitle>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
          {o.topicStats.map(({ topic, stat }) => (
            <li key={topic.id}>
              <Link href={`/topics/${topic.id}`} className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate">{topic.name}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {stat.solved}/{stat.total} · {pct(stat.mastery)}
                  </span>
                </div>
                <Meter value={stat.mastery} tone={masteryTone(stat.mastery)} label={`${topic.name} mastery`} />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Analytics() {
  const state = useStore();
  const o = overview(state);
  const s = streaks(state);
  const solvesByDay = firstSolvesByDay(state);
  const activity = activityByDay(state);
  const attempts = Object.values(state.problems).reduce((a, e) => a + e.history.length, 0);
  const everything = allProblems.map((x) => x.problem);
  const split = difficultySplit(everything, state.problems);
  const weakest = o.patternStats
    .filter((x) => x.stat.solved > 0 || x.stat.weak)
    .sort((a, b) => a.stat.mastery - b.stat.mastery)
    .slice(0, 6);
  const failedAttempts = Object.values(state.problems).reduce((a, e) => a + e.failCount, 0);
  const successRate = attempts ? 1 - failedAttempts / attempts : 0;

  if (!attempts && !o.solved.solved) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No data yet"
        description="Log your first solve and your charts start filling in. Every attempt counts: solves, revisions and misses."
        action={
          <Link href="/problems" className="text-sm font-medium text-primary hover:underline">
            Go to problems →
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel className="p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="size-3.5 text-warning" aria-hidden /> Current streak
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold">
            {s.current}
            <span className="text-base text-muted-foreground">d</span>
          </p>
        </Panel>
        <Panel className="p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Trophy className="size-3.5 text-primary" aria-hidden /> Longest streak
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold">
            {s.longest}
            <span className="text-base text-muted-foreground">d</span>
          </p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs text-muted-foreground">Attempts logged</p>
          <p className="mt-2 font-mono text-3xl font-semibold">{attempts}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs text-muted-foreground">Success rate</p>
          <p className="mt-2 font-mono text-3xl font-semibold">{pct(successRate)}</p>
          <p className="text-[11px] text-muted-foreground">{failedAttempts} unsolved attempts</p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-2">
          <SectionTitle hint="Cumulative first-time solves.">Problems solved over time</SectionTitle>
          <InView height={224}>
            <SolvedOverTime byDay={solvesByDay} />
          </InView>
        </Panel>
        <Panel className="p-5">
          <SectionTitle hint={`${o.solved.solved} solved in total.`}>Difficulty distribution</SectionTitle>
          <InView height={160}>
            <DifficultyDonut split={split} />
          </InView>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionTitle hint="Every day you logged an attempt or a mock, last 26 weeks.">Weekly activity</SectionTitle>
        <ActivityCalendar byDay={activity} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <SectionTitle hint="Share of each topic's problems solved.">Topic progress</SectionTitle>
          <InView height={620}>
            <TopicBars progress={state.problems} />
          </InView>
        </Panel>
        <div className="space-y-4">
          <Panel className="p-5">
            <SectionTitle hint="Each square is a pattern; darker = higher mastery. Click to open.">Pattern mastery</SectionTitle>
            <PatternHeatmap progress={state.problems} patterns={state.patterns} />
          </Panel>
          <Panel className="p-5">
            <SectionTitle
              hint="Lowest mastery among patterns you've practised or flagged."
              action={
                <Link href="/patterns" className="text-xs text-muted-foreground hover:text-foreground">
                  Library →
                </Link>
              }
            >
              Weakest patterns
            </SectionTitle>
            {weakest.length ? (
              <ul className="space-y-3">
                {weakest.map(({ pattern, topic, stat }) => (
                  <li key={pattern.id}>
                    <Link href={`/patterns/${pattern.id}`} className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate">
                          {pattern.name} <span className="text-xs text-muted-foreground">· {topic.name}</span>
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {pct(stat.mastery)}
                        </span>
                      </div>
                      <Meter value={stat.mastery} tone={masteryTone(stat.mastery)} label={`${pattern.name} mastery`} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Rate a few problems to see this.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

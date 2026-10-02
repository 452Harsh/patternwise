"use client";

import Link from "next/link";
import { useState } from "react";
import { BarChart3, Flame, Trophy } from "lucide-react";
import { ActivityCalendar, DifficultyDonut, InView, PatternHeatmap, SolvedOverTime, TopicBars } from "@/components/charts";
import { Coverage } from "@/components/coverage";
import { EmptyState, Meter, PageHeader, Panel, SectionTitle, Shimmer, masteryTone, pct } from "@/components/kit";
import { allProblems } from "@/data/curriculum";
import { useHydrated, useStore } from "@/lib/progress";
import { activityByDay, difficultySplit, firstSolvesByDay, overview, streaks } from "@/lib/stats";
import { cn } from "@/lib/utils";

export default function ProgressPage() {
  const hydrated = useHydrated();
  const [tab, setTab] = useState<"analytics" | "coverage">("analytics");

  return (
    <div className="space-y-8">
      <PageHeader title="Progress" subtitle="Useful numbers, not vanity metrics: where you're strong, where to push next." />

      <div className="inline-flex rounded-lg border p-0.5" role="tablist" aria-label="Progress views">
        {(
          [
            ["analytics", "Analytics"],
            ["coverage", "Coverage & gaps"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "h-7 rounded-md px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              tab === id ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

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
      ) : (
        <Analytics />
      )}
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
    .filter((x) => x.stat.rated > 0 || x.stat.weak)
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
                          {stat.avg ? `${stat.avg.toFixed(1)}/5 · ` : ""}
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

"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CircleCheck,
  Flame,
  Gauge,
  Library,
  RotateCcw,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ActivityFeed } from "@/components/activity-feed";
import { DailyPlan, useDailyPlan } from "@/components/daily-plan";
import {
  DifficultyBadge,
  EmptyState,
  Meter,
  Panel,
  Ring,
  SectionTitle,
  Shimmer,
  StatusBadge,
  Tag,
  masteryTone,
  pct,
} from "@/components/kit";
import { TopicIcon } from "@/components/topic-icon";
import { allPatterns, topics } from "@/data/curriculum";
import { useCatalog } from "@/lib/catalog";
import { greeting, relativeDay } from "@/lib/format";
import { displayStatus, isDue, needsRevisit, useHydrated, useStore } from "@/lib/progress";
import { overview, solvedSince, streaks } from "@/lib/stats";
import { cn } from "@/lib/utils";

function Metric({
  icon: Icon,
  label,
  value,
  sub,
  progress,
  tone = "primary",
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  progress?: number;
  tone?: "primary" | "success" | "warning" | "info";
  href?: string;
}) {
  const body = (
    <Panel interactive={!!href} className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={cn("grid size-7 place-items-center rounded-lg", {
            "bg-primary/10 text-primary": tone === "primary",
            "bg-success/10 text-success": tone === "success",
            "bg-warning/10 text-warning": tone === "warning",
            "bg-info/10 text-info": tone === "info",
          })}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      {progress !== undefined && <Meter value={progress} tone={tone} className="mt-3" label={label} />}
    </Panel>
  );
  return href ? (
    <Link href={href} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  ) : (
    body
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Shimmer className="h-8 w-72" />
        <Shimmer className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Panel key={i} className="space-y-3 p-4">
            <Shimmer className="h-3 w-20" />
            <Shimmer className="h-8 w-16" />
            <Shimmer className="h-1.5 w-full" />
          </Panel>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel className="h-64 lg:col-span-3" />
        <Panel className="h-64 lg:col-span-2" />
      </div>
    </div>
  );
}

function motivation(solvedWeek: number, streak: number, done: number, total: number) {
  if (total && done === total) return "Today's plan is done. Anything extra is a bonus.";
  if (streak >= 7) return `${streak} days in a row. Consistency beats cramming.`;
  if (solvedWeek >= 5) return `${solvedWeek} new problems this week. Make sure you can explain each pattern.`;
  if (streak > 0) return "Keep the streak alive with one focused problem today.";
  return "Pick one pattern, solve one problem, write down the signal you noticed.";
}

export default function Dashboard() {
  const state = useStore();
  const hydrated = useHydrated();
  const catalog = useCatalog();
  const plan = useDailyPlan();

  if (!hydrated) return <DashboardSkeleton />;

  const o = overview(state);
  const s = streaks(state);
  const week = solvedSince(state, 7);
  const toRevise = Object.values(state.problems).filter((e) => isDue(e) || needsRevisit(e)).length;
  const name = state.settings.name;
  const todayAttempts = Object.values(state.problems).reduce(
    (a, e) => a + e.history.filter((h) => h.date === plan.date).length,
    0,
  );

  const recent = catalog
    .filter((x) => state.problems[x.problem.slug]?.lastAttemptAt)
    .sort((a, b) => state.problems[b.problem.slug].lastAttemptAt!.localeCompare(state.problems[a.problem.slug].lastAttemptAt!))
    .slice(0, 3);

  const weakTopics = o.topicStats
    .filter((x) => x.stat.started)
    .sort((a, b) => a.stat.mastery - b.stat.mastery)
    .slice(0, 5);
  const weakPatterns = o.patternStats
    .filter((x) => x.stat.weak)
    .sort((a, b) => a.stat.mastery - b.stat.mastery)
    .slice(0, 4);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting()}
            {name ? `, ${name}` : ""} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Keep building your problem-solving intuition.</p>
          <p className="mt-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-surface px-3 py-1.5 text-xs text-muted-foreground">
            <span className="font-mono text-foreground">
              today · {plan.done}/{plan.items.length} tasks · {todayAttempts} attempt{todayAttempts === 1 ? "" : "s"}
            </span>
            <span aria-hidden>—</span>
            {motivation(week, s.current, plan.done, plan.items.length)}
          </p>
        </div>
        {!name && (
          <Link href="/settings" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Set your name
          </Link>
        )}
      </header>

      <section aria-labelledby="overview" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <h2 id="overview" className="sr-only">
          Overview
        </h2>
        <Metric
          icon={CircleCheck}
          label="Problems solved"
          value={o.solved.solved}
          sub={week ? <span className="text-success">+{week} this week</span> : `of ${o.solved.total} curated`}
          progress={o.solved.solved / o.solved.total}
          tone="success"
          href="/problems"
        />
        <Metric
          icon={Library}
          label="Patterns mastered"
          value={o.patternsMastered}
          sub={`of ${allPatterns.length} patterns`}
          progress={o.patternsMastered / allPatterns.length}
          href="/patterns"
        />
        <Metric
          icon={BookOpen}
          label="Topics completed"
          value={o.topicsCompleted}
          sub={`of ${topics.length} topics`}
          progress={o.topicsCompleted / topics.length}
          tone="info"
          href="/topics"
        />
        <Metric
          icon={Flame}
          label="Current streak"
          value={
            <>
              {s.current}
              <span className="text-base text-muted-foreground">d</span>
            </>
          }
          sub={s.activeToday ? `Longest ${s.longest}d · active today` : `Longest ${s.longest}d`}
          tone="warning"
          href="/progress"
        />
        <Metric
          icon={RotateCcw}
          label="To revise"
          value={toRevise}
          sub={o.due ? <span className="text-warning">{o.due} due now</span> : "Nothing due"}
          tone="warning"
          href="/revision"
        />
        <Metric
          icon={Gauge}
          label="Interview readiness"
          value={pct(o.readiness)}
          sub="essentials · core · revision · mocks"
          progress={o.readiness}
          href="/interview"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="min-w-0 lg:col-span-3" aria-labelledby="plan">
          <SectionTitle
            id="plan"
            hint="Generated each morning from your current phase and weak spots."
            action={
              <Link href="/study-plan" className="text-xs text-muted-foreground hover:text-foreground">
                Study plan →
              </Link>
            }
          >
            Today&apos;s study plan
          </SectionTitle>
          <DailyPlan />
        </section>

        <section className="min-w-0 lg:col-span-2" aria-labelledby="prep">
          <SectionTitle id="prep" hint="Average of the five tracks below.">
            Overall preparation
          </SectionTitle>
          <Panel className="p-5">
            <div className="flex items-center gap-5">
              <Ring value={o.preparation} size={112} label={`DSA preparation ${pct(o.preparation)}`}>
                <div>
                  <div className="font-mono text-2xl font-semibold tabular-nums">{pct(o.preparation)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">complete</div>
                </div>
              </Ring>
              <div className="min-w-0">
                <p className="font-medium">DSA preparation</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Topics, patterns, problems, revision and mock interviews, weighted equally.
                </p>
              </div>
            </div>
            <ul className="mt-5 space-y-3">
              {o.segments.map((seg) => (
                <li key={seg.key}>
                  <div className="mb-1 flex items-baseline justify-between text-xs">
                    <span className="font-medium">{seg.label}</span>
                    <span className="font-mono text-muted-foreground">
                      {seg.detail} · {pct(seg.value)}
                    </span>
                  </div>
                  <Meter value={seg.value} label={seg.label} />
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </div>

      <section aria-labelledby="continue">
        <SectionTitle id="continue" hint="Pick up where you left off.">
          Continue learning
        </SectionTitle>
        {recent.length ? (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {recent.map(({ problem, topic, pattern, platform }) => {
              const e = state.problems[problem.slug];
              return (
                <li key={problem.slug}>
                  <Panel interactive className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 font-medium leading-snug">{problem.title}</p>
                      <DifficultyBadge difficulty={problem.difficulty} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Tag mono>{platform}</Tag>
                      <Tag>{topic.name}</Tag>
                      <Tag>{pattern.name}</Tag>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Last attempted</dt>
                        <dd className="font-mono">{relativeDay(e.lastAttemptAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Next revision</dt>
                        <dd className={cn("font-mono", isDue(e) && "text-warning")}>{isDue(e) ? "due" : relativeDay(e.nextReview)}</dd>
                      </div>
                    </dl>
                    <div className="mt-auto flex items-center justify-between border-t pt-3">
                      <StatusBadge status={displayStatus(e)} />
                      <Link
                        href={`/problems/${problem.slug}`}
                        className={buttonVariants({ size: "sm", variant: "secondary" })}
                      >
                        Continue <ArrowRight data-icon="inline-end" />
                      </Link>
                    </div>
                  </Panel>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={Rocket}
            title="No problems solved yet."
            description="Your DSA journey starts here. Open today's first problem, or add one of your own."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/topics/arrays-hashing" className={buttonVariants({ size: "sm" })}>
                  Start with Arrays & Hashing
                </Link>
                <Link href="/problems?add=1" className={buttonVariants({ size: "sm", variant: "outline" })}>
                  Add your first problem
                </Link>
              </div>
            }
          />
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="min-w-0" aria-labelledby="weak">
          <SectionTitle
            id="weak"
            hint="Mastery across topics you've started. Lowest first — that's where the gains are."
            action={
              <Link href="/progress" className="text-xs text-muted-foreground hover:text-foreground">
                Analytics →
              </Link>
            }
          >
            Focus areas
          </SectionTitle>
          {weakTopics.length ? (
            <Panel className="space-y-4 p-4">
              {weakTopics.map(({ topic, stat }) => (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.id}`}
                  className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <TopicIcon id={topic.id} className="size-7 [&_svg]:size-3.5" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between text-sm">
                      <span className="truncate">{topic.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{pct(stat.mastery)}</span>
                    </div>
                    <Meter value={stat.mastery} tone={masteryTone(stat.mastery)} label={`${topic.name} mastery`} />
                  </div>
                </Link>
              ))}
              {weakPatterns.length > 0 && (
                <div className="border-t pt-3">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Patterns to reinforce</p>
                  <div className="flex flex-wrap gap-1.5">
                    {weakPatterns.map(({ pattern, stat }) => (
                      <Link
                        key={pattern.id}
                        href={`/patterns/${pattern.id}`}
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                        title={stat.reason}
                      >
                        {pattern.name} <ArrowUpRight className="size-3 text-muted-foreground" aria-hidden />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          ) : (
            <EmptyState
              icon={Gauge}
              title="Nothing to analyse yet"
              description="Once you've rated a few problems, your weakest topics and patterns appear here."
            />
          )}
        </section>

        <section className="min-w-0" aria-labelledby="activity">
          <SectionTitle id="activity" hint="Your latest solves, reviews and notes.">
            Recent activity
          </SectionTitle>
          <ActivityFeed limit={7} />
        </section>
      </div>
    </div>
  );
}

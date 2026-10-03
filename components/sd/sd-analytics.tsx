"use client";

import Link from "next/link";
import { BarChart3, Flame, Trophy } from "lucide-react";
import { ActivityCalendar, InView, SolvedOverTime } from "@/components/charts";
import { Confidence, EmptyState, Panel, SectionTitle } from "@/components/kit";
import { useStore } from "@/lib/progress";
import { sdOverview } from "@/lib/sd";
import { activityByDay, streaks } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { TrackTag } from "./sd-kit";

/** System Design analytics: activity, streaks, items learned over time, confidence and weakest items. */
export function SDAnalytics() {
  const state = useStore();
  const o = sdOverview(state);
  const s = streaks(state, "sd");
  const activity = activityByDay(state, "sd");
  const reviews = Object.values(state.sd).reduce((a, e) => a + e.history.length, 0);
  const ratings = [1, 2, 3, 4, 5].map((r) => Object.values(state.sd).filter((e) => e.history.length && e.confidence === r).length);
  const maxRating = Math.max(1, ...ratings);

  // First time each item was studied, per day (for the "learned over time" chart).
  const firsts = new Map<string, number>();
  for (const e of Object.values(state.sd)) {
    const d = e.history[0]?.date;
    if (d) firsts.set(d, (firsts.get(d) ?? 0) + 1);
  }

  if (!reviews) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No System Design data yet"
        description="Rate a concept or practise a design problem and your analytics fill in."
        action={
          <Link href="/system-design/concepts" className="text-sm font-medium text-primary hover:underline">
            Browse concepts →
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
          <p className="text-xs text-muted-foreground">Reviews logged</p>
          <p className="mt-2 font-mono text-3xl font-semibold">{reviews}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs text-muted-foreground">Mock sessions</p>
          <p className="mt-2 font-mono text-3xl font-semibold">{state.sdSessions.length}</p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-2">
          <SectionTitle hint="Cumulative concepts, patterns, problems and diagrams you've started.">Items learned over time</SectionTitle>
          <InView height={224}>
            <SolvedOverTime byDay={firsts} />
          </InView>
        </Panel>
        <Panel className="p-5">
          <SectionTitle hint="Across everything you've rated.">Confidence distribution</SectionTitle>
          <div className="flex h-36 items-end gap-3" role="img" aria-label={`Confidence counts: ${ratings.join(", ")}`}>
            {ratings.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-xs">{n}</span>
                <div
                  className={cn("w-full rounded-t-md", i < 2 ? "bg-warning/70" : i < 3 ? "bg-primary/70" : "bg-success/70")}
                  style={{ height: `${(n / maxRating) * 88 + 4}px` }}
                />
                <span className="text-[10px] text-muted-foreground">{["Forgot", "Practice", "Understand", "Strong", "Mastered"][i]}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionTitle hint="Every day with a System Design review, practice or session, last 26 weeks.">Study activity</SectionTitle>
        <ActivityCalendar byDay={activity} />
      </Panel>

      <Panel className="p-5">
        <SectionTitle hint="Lowest confidence among items you've reviewed.">Weakest items</SectionTitle>
        {o.weak.length ? (
          <ul className="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
            {o.weak.slice(0, 10).map((x) => (
              <li key={x.key} className="flex items-center justify-between gap-3 text-sm">
                <Link href={x.href} className="min-w-0 truncate hover:text-primary">
                  {x.title}
                </Link>
                <span className="flex shrink-0 items-center gap-2">
                  <TrackTag track={x.track} />
                  <Confidence value={state.sd[x.key].confidence} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing rated low. Keep going.</p>
        )}
      </Panel>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { shortDate } from "@/lib/format";
import { addDays, today } from "@/lib/progress";
import { cn } from "@/lib/utils";

/** Renders children only once scrolled into view, so charts animate on entry. */
export function InView({ children, className, height = 220 }: { children: React.ReactNode; className?: string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return (
    <div ref={ref} className={className} style={{ minHeight: height }}>
      {seen ? children : <div className="animate-pulse rounded-md bg-muted" style={{ height }} aria-hidden />}
    </div>
  );
}


// Heavy charts (recharts, ~110 KB gzipped) load on demand; InView already defers them until visible.
const placeholder = (h: number) =>
  function ChartLoading() {
    return <div className="animate-pulse rounded-md bg-muted" style={{ height: h }} aria-hidden />;
  };
export const SolvedOverTime = dynamic(() => import("./charts-heavy").then((m) => m.SolvedOverTime), { ssr: false, loading: placeholder(224) });
export const TopicBars = dynamic(() => import("./charts-heavy").then((m) => m.TopicBars), { ssr: false, loading: placeholder(400) });
export const DifficultyDonut = dynamic(() => import("./charts-heavy").then((m) => m.DifficultyDonut), { ssr: false, loading: placeholder(160) });
export const PatternHeatmap = dynamic(() => import("./charts-heavy").then((m) => m.PatternHeatmap), { ssr: false, loading: placeholder(400) });

export function ActivityCalendar({ byDay, weeks = 26 }: { byDay: Map<string, number>; weeks?: number }) {
  const t = today();
  const dow = new Date(`${t}T12:00:00`).getDay();
  const start = addDays(t, -(weeks * 7 - 1) - dow + 0);
  const max = Math.max(1, ...byDay.values());
  const cols = Array.from({ length: weeks + 1 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(start, w * 7 + d);
      return date > t ? null : { date, n: byDay.get(date) ?? 0 };
    }),
  );
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));
  const active = [...byDay.entries()].filter(([d]) => d >= start).length;

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-[3px]" role="img" aria-label={`Activity calendar: ${active} active days in the last ${weeks} weeks`}>
          {cols.map((col, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {col.map((c, j) =>
                c ? (
                  <span
                    key={j}
                    title={`${shortDate(c.date)}: ${c.n} attempt${c.n === 1 ? "" : "s"}`}
                    className={cn("size-[11px] rounded-[3px]", c.n === 0 && "bg-muted")}
                    style={c.n ? { background: `color-mix(in oklch, var(--success) ${25 + level(c.n) * 18}%, transparent)` } : undefined}
                  />
                ) : (
                  <span key={j} className="size-[11px]" />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          <span className="font-mono text-foreground">{active}</span> active days
        </span>
        <span className="flex items-center gap-1">
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className={cn("size-[11px] rounded-[3px]", l === 0 && "bg-muted")}
              style={l ? { background: `color-mix(in oklch, var(--success) ${25 + l * 18}%, transparent)` } : undefined}
              aria-hidden
            />
          ))}
          More
        </span>
      </div>
    </div>
  );
}

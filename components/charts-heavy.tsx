"use client";

// recharts and the DSA curriculum live here so they load only with a chart (see components/charts.tsx).
import Link from "next/link";
import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { topics } from "@/data/curriculum";
import { shortDate } from "@/lib/format";
import { addDays, today, type PatternEntry, type ProgressMap } from "@/lib/progress";
import { patternStat } from "@/lib/stats";

/* ---------- solved over time ---------- */

export function SolvedOverTime({ byDay }: { byDay: Map<string, number> }) {
  // Memoize on content so unrelated re-renders don't restart the entry animation.
  const signature = [...byDay].sort().join(";");
  const data = useMemo(() => cumulative(byDay), [signature]); // eslint-disable-line react-hooks/exhaustive-deps
  const config = { solved: { label: "Total solved", color: "var(--chart-1)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillSolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-solved)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-solved)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={32} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Area dataKey="solved" type="monotone" stroke="var(--color-solved)" strokeWidth={2} fill="url(#fillSolved)" animationDuration={900} />
      </AreaChart>
    </ChartContainer>
  );
}

function cumulative(byDay: Map<string, number>) {
  const days = [...byDay.keys()].sort();
  const t = today();
  const span = days.length ? Math.max(14, Math.min(120, -Math.round((new Date(days[0]).getTime() - new Date(t).getTime()) / 86_400_000) + 2)) : 30;
  const first = addDays(t, -span + 1);
  let running = 0;
  for (const d of days) if (d < first) running += byDay.get(d)!;
  const data: { date: string; label: string; solved: number }[] = [];
  for (let i = 0; i < span; i++) {
    const date = addDays(first, i);
    running += byDay.get(date) ?? 0;
    data.push({ date, label: shortDate(date), solved: running });
  }
  return data;
}

/* ---------- topic progress ---------- */

export function TopicBars({ progress }: { progress: ProgressMap }) {
  const data = topics.map((t) => {
    const ps = t.patterns.flatMap((p) => p.problems);
    const solved = ps.filter((p) => ["solved", "mastered"].includes(progress[p.slug]?.status ?? "")).length;
    return { topic: t.name, pct: Math.round((solved / ps.length) * 100), solved, total: ps.length };
  });
  const config = { pct: { label: "% solved", color: "var(--chart-1)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: data.length * 22 + 24 }}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="topic" width={150} tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<ChartTooltipContent hideIndicator formatter={(v, _n, item) => `${v}% · ${item.payload.solved}/${item.payload.total}`} />} />
        <Bar dataKey="pct" fill="var(--color-pct)" radius={[0, 4, 4, 0]} barSize={12} />
      </BarChart>
    </ChartContainer>
  );
}

/* ---------- difficulty donut ---------- */

export function DifficultyDonut({ split }: { split: { Easy: number; Medium: number; Hard: number } }) {
  const data = [
    { name: "Easy", value: split.Easy, fill: "var(--color-Easy)" },
    { name: "Medium", value: split.Medium, fill: "var(--color-Medium)" },
    { name: "Hard", value: split.Hard, fill: "var(--color-Hard)" },
  ];
  const total = split.Easy + split.Medium + split.Hard;
  const config = {
    Easy: { label: "Easy", color: "var(--success)" },
    Medium: { label: "Medium", color: "var(--warning)" },
    Hard: { label: "Hard", color: "var(--destructive)" },
  } satisfies ChartConfig;
  return (
    <div className="flex items-center gap-6">
      <ChartContainer config={config} className="aspect-square h-40 shrink-0">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
          <Pie data={total ? data : [{ name: "None", value: 1, fill: "var(--muted)" }]} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} strokeWidth={2} stroke="var(--card)">
            {(total ? data : [{ fill: "var(--muted)" }]).map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: config[d.name as keyof typeof config].color }} aria-hidden />
            <span className="w-16">{d.name}</span>
            <span className="font-mono tabular-nums">{d.value}</span>
            <span className="font-mono text-xs text-muted-foreground">{total ? `${Math.round((d.value / total) * 100)}%` : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- pattern mastery heatmap ---------- */

export function PatternHeatmap({ progress, patterns }: { progress: ProgressMap; patterns: Record<string, PatternEntry> }) {
  return (
    <div className="space-y-1.5">
      {topics.map((t) => (
        <div key={t.id} className="flex items-center gap-3">
          <Link href={`/topics/${t.id}`} className="w-32 shrink-0 truncate text-right text-[11px] text-muted-foreground hover:text-foreground sm:w-40">
            {t.name}
          </Link>
          <div className="flex flex-wrap gap-1">
            {t.patterns.map((p) => {
              const m = patternStat(p, progress, patterns).mastery;
              return (
                <Link
                  key={p.id}
                  href={`/patterns/${p.id}`}
                  title={`${p.name}: ${Math.round(m * 100)}% mastery`}
                  aria-label={`${p.name}: ${Math.round(m * 100)}% mastery`}
                  className="size-5 rounded-[5px] outline-none ring-1 ring-inset ring-foreground/5 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring sm:size-6"
                  style={{
                    background: m > 0 ? `color-mix(in oklch, var(--primary) ${Math.round(18 + m * 82)}%, transparent)` : "var(--muted)",
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex items-center justify-end gap-1.5 pt-2 text-[11px] text-muted-foreground">
        0%
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <span
            key={v}
            className="size-3 rounded-[3px]"
            style={{ background: v ? `color-mix(in oklch, var(--primary) ${Math.round(18 + v * 82)}%, transparent)` : "var(--muted)" }}
            aria-hidden
          />
        ))}
        100%
      </div>
    </div>
  );
}

/* ---------- activity calendar ---------- */


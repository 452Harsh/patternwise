"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader, Panel, Ring, Shimmer, masteryTone, pct } from "@/components/kit";
import { NativeSelect } from "@/components/native-select";
import { PATTERN_STATUS, PatternStatusLabel } from "@/components/pattern-status";
import { allPatterns, topics } from "@/data/curriculum";
import { blankPattern, useHydrated, usePatternProgress, useProgress, type PatternStatus } from "@/lib/progress";
import { shortDescription } from "@/lib/related";
import { difficultySplit, patternStat } from "@/lib/stats";

function DifficultyStrip({ split }: { split: { Easy: number; Medium: number; Hard: number } }) {
  const total = split.Easy + split.Medium + split.Hard || 1;
  return (
    <div className="flex items-center gap-2" aria-label={`${split.Easy} easy, ${split.Medium} medium, ${split.Hard} hard`}>
      <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span className="bg-success" style={{ width: `${(split.Easy / total) * 100}%` }} />
        <span className="bg-warning" style={{ width: `${(split.Medium / total) * 100}%` }} />
        <span className="bg-destructive" style={{ width: `${(split.Hard / total) * 100}%` }} />
      </div>
      <span className="font-mono text-[10px] text-muted-foreground" aria-hidden>
        <span className="text-success">{split.Easy}</span>·<span className="text-warning">{split.Medium}</span>·
        <span className="text-destructive">{split.Hard}</span>
      </span>
    </div>
  );
}

export default function PatternLibrary() {
  const progress = useProgress();
  const patterns = usePatternProgress();
  const hydrated = useHydrated();
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState<"all" | PatternStatus | "weak">("all");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allPatterns
      .map((x) => ({ ...x, stat: patternStat(x.pattern, progress, patterns), entry: patterns[x.pattern.id] ?? blankPattern() }))
      .filter(({ pattern, topic: t, stat, entry }) => {
        if (needle && !`${pattern.name} ${t.name} ${pattern.signals.join(" ")}`.toLowerCase().includes(needle)) return false;
        if (topic !== "all" && t.id !== topic) return false;
        if (status === "weak" && !stat.weak) return false;
        if (status !== "all" && status !== "weak" && entry.status !== status) return false;
        return true;
      });
  }, [q, topic, status, progress, patterns]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pattern Library"
        subtitle="Your personal DSA knowledge base. Learn to spot the pattern, then the problems become variations."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patterns or clues…" aria-label="Search patterns" className="w-full sm:w-72" />
        <NativeSelect aria-label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="all">All categories</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">Any status</option>
          <option value="weak">Weak only</option>
          {PATTERN_STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
        <span className="text-sm text-muted-foreground">
          <span className="font-mono text-foreground">{rows.length}</span> patterns
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={SearchX} title="No patterns match" description="Try a different search or filter." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ pattern, topic: t, stat, entry }) => (
            <li key={pattern.id}>
              <Link href={`/patterns/${pattern.id}`} className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Panel interactive className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{t.name}</p>
                      <p className="mt-0.5 font-medium leading-snug">{pattern.name}</p>
                    </div>
                    {hydrated ? (
                      <Ring value={stat.mastery} size={44} stroke={4} tone={masteryTone(stat.mastery)} label={`Mastery ${pct(stat.mastery)}`}>
                        <span className="font-mono text-[10px] font-semibold">{pct(stat.mastery)}</span>
                      </Ring>
                    ) : (
                      <Shimmer className="size-11 rounded-full" />
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{shortDescription(pattern)}</p>
                  <ul className="space-y-1">
                    {pattern.signals.slice(0, 2).map((s) => (
                      <li key={s} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                        <span className="line-clamp-1">{s}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto space-y-2 border-t pt-3">
                    <DifficultyStrip split={difficultySplit(pattern.problems)} />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        <span className="font-mono text-foreground">{hydrated ? stat.solved : 0}</span>/{stat.total} completed
                      </span>
                      {hydrated && <PatternStatusLabel status={entry.status} />}
                    </div>
                  </div>
                </Panel>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

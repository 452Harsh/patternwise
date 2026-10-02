"use client";

import Link from "next/link";
import { Panel, SectionTitle, pct } from "@/components/kit";
import { patternIndex } from "@/data/curriculum";
import { COVERAGE, type Tier } from "@/data/coverage";
import { usePatternProgress, useProgress } from "@/lib/progress";
import { patternStat } from "@/lib/stats";
import { cn } from "@/lib/utils";

type State = "not-covered" | "not-started" | "weak" | "in-progress" | "solid";

const LABEL: Record<State, string> = {
  "not-covered": "Not in curriculum",
  "not-started": "Not started",
  weak: "Weak",
  "in-progress": "In progress",
  solid: "Solid",
};
const STYLE: Record<State, string> = {
  "not-covered": "bg-muted text-muted-foreground",
  "not-started": "bg-destructive/10 text-destructive",
  weak: "bg-warning/10 text-warning",
  "in-progress": "bg-info/10 text-info",
  solid: "bg-success/10 text-success",
};
const TIERS: { tier: Tier; title: string; hint: string }[] = [
  { tier: "core", title: "Core", hint: "Asked constantly. Gaps here cost the most." },
  { tier: "common", title: "Common", hint: "Regularly asked, especially for mid/senior roles." },
  { tier: "advanced", title: "Advanced", hint: "Occasional or role-specific. Do after core and common." },
];

/** Checklist of interview areas mapped to curriculum patterns, with your status for each. */
export function Coverage() {
  const progress = useProgress();
  const patterns = usePatternProgress();

  const rows = COVERAGE.map((item) => {
    const mapped = item.patterns.map((id) => patternIndex.get(id)).filter((x) => !!x);
    const stats = mapped.map((m) => patternStat(m.pattern, progress, patterns));
    const solved = stats.reduce((a, s) => a + s.solved, 0);
    const total = stats.reduce((a, s) => a + s.total, 0);
    const mastery = stats.length ? stats.reduce((a, s) => a + s.mastery, 0) / stats.length : 0;
    const touched = solved > 0 || mapped.some((m) => (patterns[m.pattern.id]?.status ?? "unrated") !== "unrated");
    let state: State;
    if (!mapped.length) state = "not-covered";
    else if (!touched) state = "not-started";
    else if (stats.some((s) => s.weak)) state = "weak";
    else if (mastery >= 0.75) state = "solid";
    else state = "in-progress";
    return { item, mapped, solved, total, mastery, state };
  });

  const attention = rows.filter((r) => r.item.tier === "core" && (r.state === "not-started" || r.state === "weak"));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TIERS.map(({ tier, title }) => {
          const r = rows.filter((x) => x.item.tier === tier && x.state !== "not-covered");
          const started = r.filter((x) => x.state !== "not-started").length;
          const solid = r.filter((x) => x.state === "solid").length;
          return (
            <Panel key={tier} className="p-4">
              <p className="text-xs text-muted-foreground">{title} areas started</p>
              <p className="mt-1 font-mono text-2xl font-semibold">
                {started}
                <span className="text-base text-muted-foreground">/{r.length}</span>
              </p>
              <p className="text-xs text-muted-foreground">{solid} solid</p>
            </Panel>
          );
        })}
      </div>

      {attention.length > 0 && (
        <Panel className="border-warning/30 bg-warning/[0.04] p-4">
          <p className="text-sm font-medium">Core areas needing attention</p>
          <p className="mb-3 text-xs text-muted-foreground">Not started or weak. Fix these before advanced topics.</p>
          <ul className="flex flex-wrap gap-1.5">
            {attention.map(({ item, state }) => (
              <li key={item.area} className={cn("rounded-md px-2 py-1 text-xs", STYLE[state])}>
                {item.area}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {TIERS.map(({ tier, title, hint }) => (
        <section key={tier}>
          <SectionTitle hint={hint}>{title}</SectionTitle>
          <Panel className="divide-y">
            {rows
              .filter((r) => r.item.tier === tier && r.state !== "not-covered")
              .map(({ item, mapped, solved, total, mastery, state }) => (
                <div key={item.area} className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-4">
                  <span className={cn("w-fit shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium md:w-28 md:text-center", STYLE[state])}>{LABEL[state]}</span>
                  <span className="min-w-0 flex-1 text-sm">{item.area}</span>
                  <span className="flex flex-wrap gap-1">
                    {mapped.map((m) => (
                      <Link
                        key={m.pattern.id}
                        href={`/patterns/${m.pattern.id}`}
                        className="rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {m.pattern.name}
                      </Link>
                    ))}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground md:w-24 md:text-right">
                    {solved}/{total} · {pct(mastery)}
                  </span>
                </div>
              ))}
          </Panel>
        </section>
      ))}

      <section>
        <SectionTitle hint="Known gaps, left out on purpose or because they need LeetCode Premium.">Not in this curriculum</SectionTitle>
        <ul className="space-y-2 text-sm">
          {rows
            .filter((r) => r.state === "not-covered")
            .map(({ item }) => (
              <li key={item.area}>
                <span className="font-medium">{item.area}.</span> <span className="text-muted-foreground">{item.note}</span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Meter, PageHeader, Panel, Ring, SectionTitle, Shimmer, masteryTone, pct } from "@/components/kit";
import { SDAnalytics } from "@/components/sd/sd-analytics";
import { TrackTag } from "@/components/sd/sd-kit";
import { UrlTabs } from "@/components/url-tabs";
import { useHydrated, useStore } from "@/lib/progress";
import { categoryStats, sdOverview, sdPhaseProgress } from "@/lib/sd";

type Tab = "progress" | "analytics";
const TABS: [Tab, string][] = [
  ["progress", "Progress"],
  ["analytics", "Analytics"],
];

function SDProgress() {
  const state = useStore();
  const o = sdOverview(state);
  const phases = sdPhaseProgress(state);
  const cats = [...categoryStats(state, "hld"), ...categoryStats(state, "lld")];
  const tracks = [
    { label: "HLD", track: "hld" as const, s: o.hld, detail: `${o.hld.concepts.mastered}/${o.hld.concepts.total} concepts strong · ${o.hld.patterns.mastered}/${o.hld.patterns.total} patterns · ${o.hld.problems.completed}/${o.hld.problems.total} problems` },
    { label: "LLD", track: "lld" as const, s: o.lld, detail: `${o.lld.concepts.mastered}/${o.lld.concepts.total} concepts strong · ${o.lld.patterns.mastered}/${o.lld.patterns.total} patterns · ${o.lld.problems.completed}/${o.lld.problems.total} problems` },
  ];

  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <Ring value={o.overall} size={112} label={`System Design progress ${pct(o.overall)}`}>
            <div>
              <div className="font-mono text-2xl font-semibold">{pct(o.overall)}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">overall</div>
            </div>
          </Ring>
          <ul className="min-w-0 flex-1 space-y-4">
            {tracks.map((t) => (
              <li key={t.label}>
                <Link href={`/system-design/${t.track}`} className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium">
                      <TrackTag track={t.track} /> {t.label === "HLD" ? "High-Level Design" : "Low-Level Design"}
                    </span>
                    <span className="font-mono text-sm font-semibold">{pct(t.s.mastery)}</span>
                  </div>
                  <Meter value={t.s.mastery} tone={t.track === "hld" ? "info" : "primary"} className="h-2.5" label={`${t.label} mastery`} />
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{t.detail}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionTitle hint="HLD and LLD advance side by side in each phase." action={<Link href="/system-design/study-plan" className="text-xs text-muted-foreground hover:text-foreground">Study plan →</Link>}>
          Roadmap
        </SectionTitle>
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {phases.map(({ phase, value, started, items }, i) => (
            <li key={phase.id} className="rounded-lg border bg-surface p-3">
              <p className="font-mono text-[10px] text-muted-foreground">PHASE {i + 1}</p>
              <p className="mt-0.5 truncate text-sm font-medium" title={phase.name}>
                {phase.name}
              </p>
              <Meter value={value} tone={value >= 0.6 ? "success" : "primary"} className="mt-2" label={`${phase.name} progress`} />
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {pct(value)} · {started}/{items.length}
              </p>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel className="p-5">
        <SectionTitle hint="Mastery of the concepts in each category.">Category progress</SectionTitle>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
          {cats.map(({ category, mastery, started, total }) => (
            <li key={category.id}>
              <Link href={`/system-design/${category.track}#${category.id}`} className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <TrackTag track={category.track} />
                    {category.name}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {started}/{total} · {pct(mastery)}
                  </span>
                </div>
                <Meter value={mastery} tone={masteryTone(mastery)} label={`${category.name} mastery`} />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Inner() {
  const hydrated = useHydrated();
  const tab: Tab = useSearchParams().get("tab") === "analytics" ? "analytics" : "progress";
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="System Design" title={tab === "analytics" ? "Analytics" : "Progress"} subtitle="High- and low-level design mastery, tracked separately from DSA." />
      <UrlTabs base="/system-design/progress" tabs={TABS} active={tab} label="System Design progress views" />
      {!hydrated ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Panel key={i} className="space-y-3 p-5">
              <Shimmer className="h-4 w-40" />
              <Shimmer className="h-40 w-full" />
            </Panel>
          ))}
        </div>
      ) : tab === "analytics" ? (
        <SDAnalytics />
      ) : (
        <SDProgress />
      )}
    </div>
  );
}

export default function SDProgressPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}

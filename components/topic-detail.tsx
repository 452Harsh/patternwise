"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Meter, Panel, Ring, Tag, masteryTone, pct } from "@/components/kit";
import { PatternStatusLabel } from "@/components/pattern-status";
import { ProblemList } from "@/components/problem-list";
import { TopicIcon } from "@/components/topic-icon";
import { getTopic } from "@/data/curriculum";
import type { Pattern } from "@/data/types";
import { useCatalog } from "@/lib/catalog";
import { blankPattern, useHydrated, usePatternProgress, useProgress } from "@/lib/progress";
import { patternStat, topicStat } from "@/lib/stats";
import { shortDescription } from "@/lib/related";

export function TopicDetail({ id }: { id: string }) {
  const topic = getTopic(id)!;
  const progress = useProgress();
  const patterns = usePatternProgress();
  const hydrated = useHydrated();
  const catalog = useCatalog();
  const s = topicStat(topic, progress);

  const groups = new Map<string, Pattern[]>();
  for (const p of topic.patterns) groups.set(p.subtopic ?? "", [...(groups.get(p.subtopic ?? "") ?? []), p]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <TopicIcon id={topic.id} className="size-12 rounded-xl [&_svg]:size-5" />
          <div>
            <nav aria-label="Breadcrumb" className="mb-1 text-xs text-muted-foreground">
              <Link href="/topics" className="hover:text-foreground">
                Topics
              </Link>
            </nav>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{topic.name}</h1>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{topic.blurb}</p>
          </div>
        </div>
        <Panel className="flex items-center gap-4 p-4">
          <Ring value={hydrated ? s.mastery : 0} size={72} stroke={7} tone={masteryTone(s.mastery)} label={`Mastery ${pct(s.mastery)}`}>
            <span className="font-mono text-sm font-semibold">{hydrated ? pct(s.mastery) : "—"}</span>
          </Ring>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Solved</dt>
            <dd className="font-mono">
              {hydrated ? s.solved : 0}/{s.total}
            </dd>
            <dt className="text-muted-foreground">Mastered</dt>
            <dd className="font-mono">{hydrated ? s.mastered : 0}</dd>
            <dt className="text-muted-foreground">Confidence</dt>
            <dd className="font-mono">{hydrated && s.avg ? `${s.avg.toFixed(1)}/5` : "—"}</dd>
          </dl>
        </Panel>
      </header>

      {[...groups.entries()].map(([subtopic, ps]) => (
        <div key={subtopic || "main"} className="space-y-8">
          {subtopic && (
            <h2 className="border-b pb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">{subtopic}</h2>
          )}
          {ps.map((p) => {
            const st = patternStat(p, progress, patterns);
            const items = catalog.filter((x) => x.pattern.id === p.id);
            return (
              <section key={p.id} id={p.id} aria-labelledby={`${p.id}-h`} className="scroll-mt-20 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <Link href={`/patterns/${p.id}`} className="group inline-flex items-center gap-1.5 outline-none focus-visible:underline">
                      <h3 id={`${p.id}-h`} className="text-base font-semibold group-hover:text-primary">
                        {p.name}
                      </h3>
                      <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden />
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">{shortDescription(p)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {hydrated && <PatternStatusLabel status={(patterns[p.id] ?? blankPattern()).status} />}
                    {hydrated && st.weak && <Tag className="bg-warning/10 text-warning">{st.reason}</Tag>}
                    <span className="w-24">
                      <Meter value={hydrated ? st.mastery : 0} tone={masteryTone(st.mastery)} label={`${p.name} mastery`} />
                    </span>
                  </div>
                </div>
                <ProblemList items={items} hideTopic hidePattern />
              </section>
            );
          })}
        </div>
      ))}
    </div>
  );
}

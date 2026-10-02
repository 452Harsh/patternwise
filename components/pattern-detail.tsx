"use client";

import Link from "next/link";
import { ArrowUpRight, Lightbulb } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { CodeBlock } from "@/components/code-block";
import { DifficultyBadge, Meter, Panel, Ring, Tag, masteryTone, pct } from "@/components/kit";
import { PatternStatusControl } from "@/components/pattern-status";
import { ProblemList } from "@/components/problem-list";
import { patternIndex } from "@/data/curriculum";
import { COMPLEXITY } from "@/data/pattern-meta";
import { useCatalog } from "@/lib/catalog";
import { blankPattern, updatePattern, useHydrated, usePatternProgress, useProgress } from "@/lib/progress";
import { relatedPatterns } from "@/lib/related";
import { patternStat } from "@/lib/stats";

function Block({ title, children, id }: { title: string; children: React.ReactNode; id: string }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-3 text-sm font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullets({ items, tone = "bg-primary" }: { items: string[]; tone?: string }) {
  return (
    <ul className="space-y-2">
      {items.map((s) => (
        <li key={s} className="flex gap-2.5 text-sm leading-relaxed">
          <span className={`mt-2 size-1.5 shrink-0 rounded-full ${tone}`} aria-hidden />
          {s}
        </li>
      ))}
    </ul>
  );
}

export function PatternDetail({ id }: { id: string }) {
  const { pattern, topic } = patternIndex.get(id)!;
  const progress = useProgress();
  const patterns = usePatternProgress();
  const hydrated = useHydrated();
  const catalog = useCatalog();
  const st = patternStat(pattern, progress, patterns);
  const entry = patterns[id] ?? blankPattern();
  const items = catalog.filter((x) => x.pattern.id === id);
  const examples = [...pattern.problems].sort((a, b) => ["Easy", "Medium", "Hard"].indexOf(a.difficulty) - ["Easy", "Medium", "Hard"].indexOf(b.difficulty)).slice(0, 3);
  const complexity = COMPLEXITY[id];
  const related = relatedPatterns(id);

  return (
    <div className="space-y-10">
      <header className="space-y-5">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/patterns" className="hover:text-foreground">
            Pattern Library
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/topics/${topic.id}`} className="hover:text-foreground">
            {topic.name}
          </Link>
        </nav>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{pattern.name}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pattern.approach}</p>
            <div className="mt-4">
              <PatternStatusControl pattern={pattern} />
            </div>
          </div>
          <Panel className="flex shrink-0 items-center gap-4 p-4">
            <Ring value={hydrated ? st.mastery : 0} size={72} stroke={7} tone={masteryTone(st.mastery)} label={`Mastery ${pct(st.mastery)}`}>
              <span className="font-mono text-sm font-semibold">{hydrated ? pct(st.mastery) : "—"}</span>
            </Ring>
            <dl className="grid grid-cols-2 gap-x-5 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Completed</dt>
              <dd className="font-mono">
                {hydrated ? st.solved : 0}/{st.total}
              </dd>
              <dt className="text-muted-foreground">Confidence</dt>
              <dd className="font-mono">{hydrated && st.avg ? `${st.avg.toFixed(1)}/5` : "—"}</dd>
              {complexity && (
                <>
                  <dt className="text-muted-foreground">Time</dt>
                  <dd className="font-mono">{complexity.time.split(" · ")[0]}</dd>
                </>
              )}
            </dl>
          </Panel>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Block id="recognize" title="How do I recognise it?">
              <Panel className="border-primary/25 bg-primary/[0.05] p-4">
                <Bullets items={pattern.signals} />
              </Panel>
            </Block>
            {pattern.transfer && (
              <Block id="when" title="When should I use it?">
                <Panel className="p-4">
                  <p className="mb-2 text-xs text-muted-foreground">Reach for it on problems like:</p>
                  <Bullets items={pattern.transfer} tone="bg-info" />
                </Panel>
              </Block>
            )}
          </div>

          {pattern.template && (
            <Block id="template" title="Common template">
              <CodeBlock code={pattern.template} language="python" />
            </Block>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Block id="variations" title="Common variations">
              <Bullets items={pattern.variations} tone="bg-success" />
            </Block>
            <Block id="mistakes" title="Common mistakes">
              <Bullets items={pattern.pitfalls} tone="bg-warning" />
            </Block>
          </div>

          {complexity && (
            <Block id="complexity" title="Complexity">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Panel className="px-4 py-3">
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="mt-0.5 font-mono font-medium">{complexity.time}</p>
                </Panel>
                <Panel className="px-4 py-3">
                  <p className="text-xs text-muted-foreground">Space</p>
                  <p className="mt-0.5 font-mono font-medium">{complexity.space}</p>
                </Panel>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Typical for the canonical form; individual problems vary.</p>
            </Block>
          )}

          <Block id="examples" title="Example problems">
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {examples.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/problems/${p.slug}`}
                    className="flex h-full flex-col gap-2 rounded-xl border bg-surface p-3 outline-none transition-colors hover:border-foreground/15 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-snug">{p.title}</span>
                      <DifficultyBadge difficulty={p.difficulty} />
                    </span>
                    <span className="flex gap-1.5 text-xs text-muted-foreground">
                      <Lightbulb className="mt-0.5 size-3 shrink-0 text-warning" aria-hidden />
                      {p.takeaway}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Block>

          <Block id="practice" title={`Problems to practice (${items.length})`}>
            <ProblemList items={items} hideTopic hidePattern />
          </Block>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-6 lg:self-start">
          <Block id="my-notes" title="My pattern notes">
            <Textarea
              value={entry.note}
              onChange={(e) => updatePattern(id, { note: e.target.value })}
              rows={6}
              placeholder="Your own explanation, the trigger phrase you look for, a mnemonic…"
              className="bg-surface leading-relaxed"
              aria-label={`Notes for ${pattern.name}`}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Explaining it in your words is the fastest way to own it.</p>
          </Block>

          {related.length > 0 && (
            <Block id="similar" title="Similar patterns">
              <ul className="space-y-1.5">
                {related.map((r) => {
                  const rs = patternStat(r.pattern, progress, patterns);
                  return (
                    <li key={r.pattern.id}>
                      <Link
                        href={`/patterns/${r.pattern.id}`}
                        className="block rounded-lg border bg-surface px-3 py-2 outline-none transition-colors hover:border-foreground/15 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium">{r.pattern.name}</span>
                          <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        </span>
                        <span className="mt-1 block truncate text-[11px] text-muted-foreground">{r.why}</span>
                        <Meter value={hydrated ? rs.mastery : 0} tone={masteryTone(rs.mastery)} className="mt-2 h-1" label={`${r.pattern.name} mastery`} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Block>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Tag>{topic.name}</Tag>
            {pattern.subtopic && <Tag>{pattern.subtopic}</Tag>}
          </div>
        </aside>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowUpRight, CircleMinus, CirclePlus, MessageCircleQuestion } from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { Panel, Tag } from "@/components/kit";
import { HLD_PATTERNS, HLD_PROBLEMS, LLD_PROBLEMS, SD_CATEGORIES, conceptById, sdKey } from "@/data/sd";
import { useStore } from "@/lib/progress";
import { FlowDiagram } from "./flow-diagram";
import { CompleteButton, SDNotes, SDProgressPanel, SDStatusBadge, TrackTag } from "./sd-kit";

export function Block({ id, title, children, hint }: { id: string; title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 id={`${id}-h`} className="text-sm font-semibold tracking-tight">
          {title}
        </h2>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export function Bullets({ items, tone = "bg-primary" }: { items: string[]; tone?: string }) {
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

export function ConceptDetail({ id }: { id: string }) {
  const c = conceptById.get(id)!;
  const key = sdKey("concept", id);
  const state = useStore();
  const category = SD_CATEGORIES.find((x) => x.id === c.category);
  const usedInPatterns = c.track === "hld" ? HLD_PATTERNS.filter((p) => p.concepts.includes(id)) : [];
  const usedInProblems = [
    ...HLD_PROBLEMS.filter((p) => p.concepts.includes(id)),
    ...LLD_PROBLEMS.filter((p) => p.concepts.includes(id)),
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/system-design/concepts" className="hover:text-foreground">
            Concepts
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/system-design/${c.track}#${c.category}`} className="hover:text-foreground">
            {category?.name}
          </Link>
        </nav>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2">
              <TrackTag track={c.track} />
              <SDStatusBadge entry={state.sd[key]} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{c.name}</h1>
            <div className="mt-3 lg:hidden">
              <CompleteButton itemKey={key} title={c.name} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{category?.name}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-10">
          <Block id="what" title="What is it?">
            <p className="text-sm leading-relaxed">{c.summary}</p>
          </Block>

          <Block id="why" title="Why do we use it?">
            <Panel className="border-primary/25 bg-primary/[0.05] p-4 text-sm leading-relaxed">{c.why}</Panel>
          </Block>

          <Block id="when" title="When should I use it?">
            <Bullets items={c.whenToUse} tone="bg-info" />
          </Block>

          <Block id="how" title="How does it work?">
            <ol className="space-y-2">
              {c.howItWorks.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted font-mono text-[11px] font-semibold">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            {c.flow && <FlowDiagram spec={c.flow} className="mt-4" />}
          </Block>

          {c.example && (
            <Block id="example" title="Example">
              <CodeBlock code={c.example.code} language={c.example.language} />
            </Block>
          )}

          <Block id="tradeoffs" title="Trade-offs">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Panel className="p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-success">
                  <CirclePlus className="size-3.5" aria-hidden /> Pros
                </p>
                <Bullets items={c.pros} tone="bg-success" />
              </Panel>
              <Panel className="p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-warning">
                  <CircleMinus className="size-3.5" aria-hidden /> Cons
                </p>
                <Bullets items={c.cons} tone="bg-warning" />
              </Panel>
            </div>
          </Block>

          <Block id="questions" title="Common interview questions" hint="Answer them out loud.">
            <ul className="space-y-2">
              {c.interviewQuestions.map((q) => (
                <li key={q} className="flex gap-2.5 rounded-lg border bg-surface px-3 py-2.5 text-sm">
                  <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {q}
                </li>
              ))}
            </ul>
          </Block>

          <Block id="related" title="Related concepts">
            <ul className="flex flex-wrap gap-2">
              {c.related.map((rid) => {
                const r = conceptById.get(rid);
                if (!r) return null;
                return (
                  <li key={rid}>
                    <Link
                      href={`/system-design/concepts/${rid}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-1.5 text-sm outline-none transition-colors hover:border-foreground/15 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {r.name} <ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
            {(usedInPatterns.length > 0 || usedInProblems.length > 0) && (
              <div className="mt-4 space-y-2 text-sm">
                {usedInPatterns.length > 0 && (
                  <p className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Used in patterns:</span>
                    {usedInPatterns.map((p) => (
                      <Link key={p.id} href={`/system-design/patterns/${p.id}`} className="hover:underline">
                        <Tag>{p.name}</Tag>
                      </Link>
                    ))}
                  </p>
                )}
                {usedInProblems.length > 0 && (
                  <p className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Practise it in:</span>
                    {usedInProblems.map((p) => (
                      <Link key={p.id} href={`/system-design/problems/${p.id}`} className="hover:underline">
                        <Tag>{p.title}</Tag>
                      </Link>
                    ))}
                  </p>
                )}
              </div>
            )}
          </Block>

          <Block id="notes" title="My notes" hint="Autosaves">
            <SDNotes itemKey={key} title={c.name} />
          </Block>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start" aria-label="Your progress">
          <SDProgressPanel itemKey={key} title={c.name} />
        </aside>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowUpRight, CircleMinus, CirclePlus, Lightbulb, Scale } from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { DifficultyBadge, Panel, Tag } from "@/components/kit";
import { conceptById, findPattern, hldProblemById, lldPatternById, lldProblemById, sdKey } from "@/data/sd";
import type { HLDPattern, LLDPattern } from "@/data/sd/types";
import { useStore } from "@/lib/progress";
import { Block, Bullets } from "./concept-detail";
import { FlowDiagram } from "./flow-diagram";
import { CompleteButton, SDNotes, SDProgressPanel, SDStatusBadge, TrackTag } from "./sd-kit";
import { UMLDiagram, UMLLegend } from "./uml-diagram";

const LinkChips = ({ items }: { items: { href: string; label: string; extra?: React.ReactNode }[] }) => (
  <ul className="flex flex-wrap gap-2">
    {items.map((x) => (
      <li key={x.href}>
        <Link
          href={x.href}
          className="inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-1.5 text-sm outline-none transition-colors hover:border-foreground/15 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {x.label}
          {x.extra}
          <ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden />
        </Link>
      </li>
    ))}
  </ul>
);

function ProsCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Panel className="p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-success">
          <CirclePlus className="size-3.5" aria-hidden /> Advantages
        </p>
        <Bullets items={pros} tone="bg-success" />
      </Panel>
      <Panel className="p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-warning">
          <CircleMinus className="size-3.5" aria-hidden /> Disadvantages
        </p>
        <Bullets items={cons} tone="bg-warning" />
      </Panel>
    </div>
  );
}

function WhenBlocks({ when, whenNot }: { when: string[]; whenNot: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Block id="when" title="When to use">
        <Bullets items={when} tone="bg-info" />
      </Block>
      <Block id="when-not" title="When not to use">
        <Bullets items={whenNot} tone="bg-destructive" />
      </Block>
    </div>
  );
}

function HLDBody({ p }: { p: HLDPattern }) {
  return (
    <>
      <Block id="description" title="Description">
        <p className="text-sm leading-relaxed">{p.summary}</p>
      </Block>
      <Block id="problem" title="Problem it solves">
        <Panel className="border-primary/25 bg-primary/[0.05] p-4 text-sm leading-relaxed">{p.problem}</Panel>
      </Block>
      <WhenBlocks when={p.whenToUse} whenNot={p.whenNotToUse} />
      <Block id="diagram" title="Architecture diagram">
        <FlowDiagram spec={p.diagram} />
      </Block>
      <Block id="pros-cons" title="Advantages & disadvantages">
        <ProsCons pros={p.advantages} cons={p.disadvantages} />
      </Block>
      <Block id="tradeoffs" title="Trade-offs">
        <ul className="space-y-2">
          {p.tradeoffs.map((t) => (
            <li key={t} className="flex gap-2.5 rounded-lg border bg-surface px-3 py-2.5 text-sm">
              <Scale className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </Block>
      <Block id="related" title="Related concepts">
        <LinkChips items={p.concepts.map((id) => ({ href: `/system-design/concepts/${id}`, label: conceptById.get(id)?.name ?? id }))} />
      </Block>
      <Block id="practice" title="Practice problems">
        <LinkChips
          items={p.problems.map((id) => {
            const pr = hldProblemById.get(id);
            return { href: `/system-design/problems/${id}`, label: pr?.title ?? id, extra: pr ? <DifficultyBadge difficulty={pr.difficulty} /> : null };
          })}
        />
      </Block>
    </>
  );
}

function LLDBody({ p }: { p: LLDPattern }) {
  return (
    <>
      <Block id="problem" title="Problem">
        <p className="text-sm leading-relaxed">{p.problem}</p>
      </Block>
      <Block id="intent" title="Intent">
        <Panel className="border-primary/25 bg-primary/[0.05] p-4 text-sm leading-relaxed">{p.intent}</Panel>
      </Block>
      <WhenBlocks when={p.whenToUse} whenNot={p.whenNotToUse} />
      <Block id="uml" title="UML" hint="Class diagram">
        <UMLDiagram spec={p.uml} />
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">How to read the arrows</summary>
          <div className="mt-2">
            <UMLLegend />
          </div>
        </details>
      </Block>
      <Block id="example" title="Example">
        <p className="flex gap-2.5 text-sm leading-relaxed">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          {p.example}
        </p>
      </Block>
      <Block id="pros-cons" title="Advantages & disadvantages">
        <ProsCons pros={p.advantages} cons={p.disadvantages} />
      </Block>
      <Block id="code" title="Code">
        <CodeBlock code={p.code.python} language="python" />
      </Block>
      <Block id="related" title="Related patterns">
        <LinkChips items={p.related.map((id) => ({ href: `/system-design/patterns/${id}`, label: lldPatternById.get(id)?.name ?? id }))} />
      </Block>
      <Block id="practice" title="Interview problems">
        <LinkChips
          items={p.problems.map((id) => {
            const pr = lldProblemById.get(id);
            return { href: `/system-design/problems/${id}`, label: pr?.title ?? id, extra: pr ? <DifficultyBadge difficulty={pr.difficulty} /> : null };
          })}
        />
      </Block>
    </>
  );
}

export function SDPatternDetail({ id }: { id: string }) {
  const found = findPattern(id)!;
  const key = sdKey("pattern", id);
  const state = useStore();
  const name = found.pattern.name;
  const family = found.track === "lld" ? found.pattern.category : "architecture";

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/system-design/patterns" className="hover:text-foreground">
            Pattern Library
          </Link>
          <span aria-hidden>/</span>
          <span className="capitalize">{family}</span>
        </nav>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2">
              <TrackTag track={found.track} />
              <Tag className="capitalize">{family}</Tag>
              <SDStatusBadge entry={state.sd[key]} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{name}</h1>
            <div className="mt-3 lg:hidden">
              <CompleteButton itemKey={key} title={name} />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-10">
          {found.track === "hld" ? <HLDBody p={found.pattern} /> : <LLDBody p={found.pattern} />}
          <Block id="notes" title="My notes" hint="Autosaves">
            <SDNotes itemKey={key} title={name} placeholder="When would you reach for it? What's the one trade-off to mention?" />
          </Block>
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start" aria-label="Your progress">
          <SDProgressPanel itemKey={key} title={name} prompt="Could you sketch it and name its trade-offs from memory?" />
        </aside>
      </div>
    </div>
  );
}

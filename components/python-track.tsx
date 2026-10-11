"use client";

import Link from "next/link";
import { Fragment } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { PageHeader, Panel, SectionTitle, Tag } from "@/components/kit";
import { buttonVariants } from "@/components/ui/button";
import { pyChooser, pyLessons } from "@/data/python";

const leetcodeUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;

/** Renders `inline code` spans in prose. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 1 ? (
          <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/* ---------------------------------------------------------------- roadmap */

export function PyRoadmap() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Python for C++ developers"
        title="Python for DSA"
        subtitle="You already know the algorithms. This maps every STL container you use onto its Python equivalent."
        actions={
          <Link href={`/python/${pyLessons[0].id}`} className={buttonVariants()}>
            Start: {pyLessons[0].title} <ArrowRight data-icon="inline-end" />
          </Link>
        }
      />

      <section aria-labelledby="py-roadmap">
        <SectionTitle id="py-roadmap" hint="In order of how often they come up in interviews.">
          Roadmap
        </SectionTitle>
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Topic</th>
                <th className="px-4 py-2.5 font-medium">C++ STL</th>
                <th className="px-4 py-2.5 font-medium">Python</th>
                <th className="px-4 py-2.5 font-medium">Behaves like</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pyLessons.map((l, i) => (
                  <tr key={l.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-4 py-3">
                      <Link href={`/python/${l.id}`} className="font-medium outline-none hover:text-primary focus-visible:underline">
                        {l.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{l.cpp}</td>
                    <td className="px-4 py-3 font-mono text-xs text-primary">{l.py}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.behavesLike}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </section>

      <section aria-labelledby="py-choose">
        <SectionTitle id="py-choose" hint="The decision you make at the start of every problem.">
          Which structure do I reach for?
        </SectionTitle>
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">I need…</th>
                <th className="px-4 py-2.5 font-medium">Python</th>
                <th className="px-4 py-2.5 font-medium">C++</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pyChooser.map((row) => (
                <tr key={row.need}>
                  <td className="px-4 py-2.5">{row.need}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{row.py}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.cpp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </section>

      <section aria-labelledby="py-how">
        <SectionTitle id="py-how">How each lesson works</SectionTitle>
        <Panel className="p-4 text-sm leading-relaxed text-muted-foreground">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>The concept in plain words, with the C++ STL equivalent side by side.</li>
            <li>The Python syntax that differs from C++, short examples, and the complexity of each operation.</li>
            <li>When to choose it, typical LeetCode problems, and the mistakes C++ programmers make when switching.</li>
          </ol>
        </Panel>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- lesson */

const SECTIONS = [
  ["concept", "Concept"],
  ["compare", "C++ vs Python"],
  ["differences", "Key differences"],
  ["examples", "Examples"],
  ["complexity", "Complexity"],
  ["when", "When to use it"],
  ["mistakes", "Common mistakes"],
] as const;

export function PyLessonView({ id }: { id: string }) {
  const index = pyLessons.findIndex((l) => l.id === id);
  const lesson = pyLessons[index];
  const prev = pyLessons[index - 1];
  const next = pyLessons[index + 1];

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Link href="/python" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Python for DSA
        </Link>
        <PageHeader
          eyebrow={`Lesson ${index + 1} of ${pyLessons.length}`}
          title={lesson.title}
          subtitle={<Rich text={lesson.summary} />}
        />
        <div className="flex flex-wrap gap-2">
          <Tag mono>C++: {lesson.cpp}</Tag>
          <Tag mono className="bg-primary/10 text-primary">
            Python: {lesson.py}
          </Tag>
          <Tag>Behaves like {lesson.behavesLike}</Tag>
        </div>
        <nav aria-label="On this page" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {SECTIONS.map(([sid, label]) => (
            <a
              key={sid}
              href={`#${sid}`}
              className="inline-flex h-7 shrink-0 items-center rounded-lg border px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <section id="concept" className="scroll-mt-6">
        <SectionTitle>Concept</SectionTitle>
        <Panel className="space-y-3 p-4 text-sm leading-relaxed">
          {lesson.concept.map((p, i) => (
            <p key={i}>
              <Rich text={p} />
            </p>
          ))}
        </Panel>
      </section>

      <section id="compare" className="scroll-mt-6 space-y-4">
        <SectionTitle hint="Same operation, side by side.">C++ vs Python</SectionTitle>
        {lesson.compare.map((c) => (
          <div key={c.label} className="space-y-2">
            <h3 className="text-sm font-medium">{c.label}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="min-w-0">
                <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">C++</p>
                <CodeBlock code={c.cpp} language="cpp" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-primary">Python</p>
                <CodeBlock code={c.py} language="python" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section id="differences" className="scroll-mt-6">
        <SectionTitle>Key differences from C++</SectionTitle>
        <Panel className="p-4">
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
            {lesson.differences.map((d, i) => (
              <li key={i}>
                <Rich text={d} />
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section id="examples" className="scroll-mt-6 space-y-4">
        <SectionTitle>Examples</SectionTitle>
        {lesson.examples.map((ex) => (
          <div key={ex.title} className="min-w-0 space-y-2">
            <h3 className="text-sm font-medium">{ex.title}</h3>
            <CodeBlock code={ex.code} />
          </div>
        ))}
      </section>

      <section id="complexity" className="scroll-mt-6">
        <SectionTitle>Time complexity</SectionTitle>
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Operation</th>
                <th className="px-4 py-2.5 font-medium">Python</th>
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lesson.complexity.map((op) => (
                <tr key={op.op}>
                  <td className="px-4 py-2.5">{op.op}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{op.code}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{op.time}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{op.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </section>

      <section id="when" className="scroll-mt-6">
        <SectionTitle>When to use it</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          <Panel className="p-4">
            <h3 className="mb-2 text-sm font-medium">Choosing</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
              {lesson.choose.map((c, i) => (
                <li key={i}>
                  <Rich text={c} />
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="space-y-3 p-4">
            <div>
              <h3 className="mb-2 text-sm font-medium">Common uses</h3>
              <div className="flex flex-wrap gap-1.5">
                {lesson.useCases.map((u) => (
                  <Tag key={u}>{u}</Tag>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Typical LeetCode problems</h3>
              <ul className="space-y-1 text-sm">
                {lesson.leetcode.map((p) => (
                  <li key={p.slug}>
                    <a
                      href={leetcodeUrl(p.slug)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-primary"
                    >
                      {p.title} <ExternalLink className="size-3 text-muted-foreground" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </div>
      </section>

      <section id="mistakes" className="scroll-mt-6">
        <SectionTitle hint="The traps C++ habits lead you into.">Common mistakes</SectionTitle>
        <Panel className="divide-y">
          {lesson.mistakes.map((m, i) => (
            <p key={i} className="flex gap-3 px-4 py-3 text-sm leading-relaxed">
              <span className="mt-0.5 font-mono text-xs text-warning">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <Rich text={m} />
              </span>
            </p>
          ))}
        </Panel>
      </section>

      <nav aria-label="Lessons" className="flex flex-col gap-2 border-t pt-6 sm:flex-row sm:justify-between">
        {prev ? (
          <Link href={`/python/${prev.id}`} className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft data-icon="inline-start" /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/python/${next.id}`} className={buttonVariants({ variant: "outline" })}>
            {next.title} <ArrowRight data-icon="inline-end" />
          </Link>
        ) : (
          <Link href="/python" className={buttonVariants({ variant: "outline" })}>
            Back to roadmap
          </Link>
        )}
      </nav>
    </div>
  );
}

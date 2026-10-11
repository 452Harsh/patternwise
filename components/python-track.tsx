"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CircleCheck, ExternalLink, Lightbulb, Lock, RotateCcw, Send } from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { Meter, PageHeader, Panel, SectionTitle, Shimmer, Tag } from "@/components/kit";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { pyChooser, pyKey, pyLessons, type PyLesson, type PyQuestion } from "@/data/python";
import { toggleChecklist, useHydrated, useStore } from "@/lib/progress";
import { cn } from "@/lib/utils";

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

function useLessonDone() {
  const checklist = useStore().checklist;
  return (lesson: PyLesson) => lesson.practice.map((_, i) => !!checklist[pyKey(lesson.id, i)]);
}

/* ---------------------------------------------------------------- roadmap */

export function PyRoadmap() {
  const hydrated = useHydrated();
  const doneFor = useLessonDone();
  const total = pyLessons.reduce((n, l) => n + l.practice.length, 0);
  const solved = pyLessons.reduce((n, l) => n + doneFor(l).filter(Boolean).length, 0);
  const next = pyLessons.find((l) => doneFor(l).some((d) => !d)) ?? pyLessons[0];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Python for C++ developers"
        title="Python for DSA"
        subtitle="You already know the algorithms. This maps every STL container you use onto its Python equivalent, then drills it with LeetCode-style practice."
        actions={
          <Link href={`/python/${next.id}`} className={buttonVariants()}>
            {solved ? "Continue" : "Start"}: {next.title} <ArrowRight data-icon="inline-end" />
          </Link>
        }
      />

      <Panel className="space-y-2 p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">Practice progress</span>
          <span className="font-mono text-xs text-muted-foreground">{hydrated ? `${solved} / ${total}` : "·"}</span>
        </div>
        <Meter value={hydrated ? solved / total : 0} tone="success" label="Python practice progress" />
      </Panel>

      <section aria-labelledby="py-roadmap">
        <SectionTitle id="py-roadmap" hint="In order of how often they come up in interviews.">
          Roadmap
        </SectionTitle>
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Topic</th>
                <th className="px-4 py-2.5 font-medium">C++ STL</th>
                <th className="px-4 py-2.5 font-medium">Python</th>
                <th className="px-4 py-2.5 font-medium">Behaves like</th>
                <th className="px-4 py-2.5 text-right font-medium">Practice</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pyLessons.map((l, i) => {
                const done = doneFor(l).filter(Boolean).length;
                return (
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
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {hydrated ? (
                        <span className={cn(done === l.practice.length ? "text-success" : "text-muted-foreground")}>
                          {done}/{l.practice.length}
                        </span>
                      ) : (
                        "·"
                      )}
                    </td>
                  </tr>
                );
              })}
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
            <li>
              Three practice questions (beginner, intermediate, interview), one at a time. Write your solution, submit it, then review it
              against the reference solution and the reviewer checklist before moving on.
            </li>
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
  ["practice", "Practice"],
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

      <section id="practice" className="scroll-mt-6">
        <SectionTitle hint="One at a time. Attempt it, submit, then review against the reference before moving on.">Practice</SectionTitle>
        <Practice lesson={lesson} />
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

/* ---------------------------------------------------------------- practice */

function Practice({ lesson }: { lesson: PyLesson }) {
  const hydrated = useHydrated();
  const done = useLessonDone()(lesson);
  const firstOpen = done.findIndex((d) => !d);
  const unlockedUpTo = firstOpen === -1 ? done.length - 1 : firstOpen;
  const [picked, setPicked] = useState<number | null>(null);
  const active = picked !== null && picked <= unlockedUpTo ? picked : unlockedUpTo;

  const complete = (i: number) => {
    toggleChecklist(pyKey(lesson.id, i), true);
    const nextOpen = done.findIndex((d, j) => !d && j !== i);
    if (nextOpen === -1) {
      toast.success(`${lesson.title}: all practice done`, { description: "On to the next lesson." });
      setPicked(i);
    } else {
      toast.success("Marked complete", { description: "Next question unlocked." });
      setPicked(nextOpen);
    }
  };

  if (!hydrated) return <Shimmer className="h-40 w-full rounded-xl" />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Practice questions">
        {lesson.practice.map((q, i) => {
          const locked = i > unlockedUpTo;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active === i}
              disabled={locked}
              onClick={() => setPicked(i)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active === i ? "border-primary/40 bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                locked && "cursor-not-allowed opacity-50 hover:bg-transparent",
              )}
            >
              {done[i] ? <CircleCheck className="size-3.5 text-success" /> : locked ? <Lock className="size-3.5" /> : null}
              {i + 1}. {q.level}
            </button>
          );
        })}
      </div>
      <QuestionCard
        key={`${lesson.id}-${active}`}
        q={lesson.practice[active]}
        done={done[active]}
        onComplete={() => complete(active)}
        onReopen={() => toggleChecklist(pyKey(lesson.id, active), false)}
      />
    </div>
  );
}

function QuestionCard({
  q,
  done,
  onComplete,
  onReopen,
}: {
  q: PyQuestion;
  done: boolean;
  onComplete: () => void;
  onReopen: () => void;
}) {
  const [code, setCode] = useState(q.starter);
  const [hints, setHints] = useState(0);
  const [stage, setStage] = useState<"attempt" | "review">(done ? "review" : "attempt");
  const [checked, setChecked] = useState<boolean[]>(() => q.review.map(() => false));
  const attempted = code.trim() !== q.starter.trim() && code.trim() !== "";

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab" || e.shiftKey) return;
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart: s, selectionEnd: end } = el;
    const nextCode = code.slice(0, s) + "    " + code.slice(end);
    setCode(nextCode);
    requestAnimationFrame(() => el.setSelectionRange(s + 4, s + 4));
  };

  return (
    <Panel className="space-y-5 p-4 sm:p-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Tag className={cn(q.level === "Interview" ? "bg-destructive/10 text-destructive" : q.level === "Intermediate" ? "bg-warning/10 text-warning" : "bg-success/10 text-success")}>
            {q.level}
          </Tag>
          <h3 className="font-medium">{q.title}</h3>
          {q.leetcode && (
            <a
              href={leetcodeUrl(q.leetcode)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              LeetCode <ExternalLink className="size-3" />
            </a>
          )}
        </div>
        <p className="text-sm leading-relaxed">
          <Rich text={q.prompt} />
        </p>
        {q.sample && <CodeBlock code={q.sample} className="text-[12px]" />}
      </div>

      {stage === "attempt" ? (
        <>
          <div className="space-y-1.5">
            <label htmlFor="py-attempt" className="text-xs font-medium text-muted-foreground">
              Your solution (Python)
            </label>
            <textarea
              id="py-attempt"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              rows={Math.min(24, Math.max(10, code.split("\n").length + 2))}
              className="w-full resize-y rounded-lg border border-input bg-surface p-3 font-mono text-[12.5px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-[11px] text-muted-foreground">Tab inserts four spaces. Paste from your editor or LeetCode if you prefer.</p>
          </div>

          {hints > 0 && (
            <ul className="space-y-1.5">
              {q.hints.slice(0, hints).map((h, i) => (
                <li key={i} className="flex gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warning" />
                  <span>
                    <Rich text={h} />
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setStage("review")} disabled={!attempted}>
              <Send data-icon="inline-start" /> Submit for review
            </Button>
            {hints < q.hints.length && (
              <Button variant="outline" onClick={() => setHints(hints + 1)}>
                <Lightbulb data-icon="inline-start" /> Hint {hints + 1} of {q.hints.length}
              </Button>
            )}
            {hints === q.hints.length && !attempted && (
              <Button variant="ghost" onClick={() => setStage("review")}>
                Stuck: show the solution
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-5">
          {attempted && (
            <div className="min-w-0 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Your solution</p>
              <CodeBlock code={code} />
            </div>
          )}
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-medium text-primary">Reference solution</p>
            <CodeBlock code={q.solution} />
            <p className="text-sm">
              <span className="font-medium">Complexity:</span> <Rich text={q.complexity} />
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Review checklist</p>
            <p className="text-xs text-muted-foreground">Tick each point your code already does. Anything unticked is what to fix or remember.</p>
            <div className="divide-y rounded-lg border">
              {q.review.map((r, i) => (
                <label key={i} className="flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm">
                  <Checkbox
                    checked={checked[i]}
                    onCheckedChange={(v) => setChecked(checked.map((c, j) => (j === i ? v === true : c)))}
                    className="mt-0.5"
                  />
                  <span className={cn(checked[i] && "text-muted-foreground")}>
                    <Rich text={r} />
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {done ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-sm text-success">
                  <CircleCheck className="size-4" /> Completed
                </span>
                <Button variant="ghost" onClick={() => { onReopen(); setStage("attempt"); }}>
                  <RotateCcw data-icon="inline-start" /> Redo this question
                </Button>
              </>
            ) : (
              <>
                <Button onClick={onComplete}>
                  <CircleCheck data-icon="inline-start" /> Mark complete and continue
                </Button>
                <Button variant="outline" onClick={() => setStage("attempt")}>
                  Keep working on my solution
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

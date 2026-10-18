"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BookmarkPlus,
  BookmarkCheck,
  ChevronDown,
  CircleCheck,
  ExternalLink,
  Lightbulb,
  Pause,
  Play,
  Star,
  Timer,
  Trash2,
  FileQuestion,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CodeBlock } from "@/components/code-block";
import { RevisionDialog } from "@/components/revision-dialog";
import { DifficultyBadge, EmptyState, Panel, Shimmer, StatusBadge, Tag } from "@/components/kit";
import { IMPORTANT_SET } from "@/data/important";
import type { Pattern, Problem } from "@/data/types";
import { useCatalog, useCatalogItem, type CatalogItem } from "@/lib/catalog";
import { duration } from "@/lib/format";
import {
  blankEntry,
  displayStatus,
  isDue,
  isSolved,
  markSolved,
  removeCustomProblem,
  updateEntry,
  useHydrated,
  useProgress,
  type Entry,
} from "@/lib/progress";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const SECTIONS = [
  ["problem", "Problem"],
  ["hints", "Hints"],
  ["solve", "How to solve"],
  ["similar", "Similar"],
] as const;

/** Input size → the complexity that fits in time (~10⁸ simple operations). */
const CONSTRAINT_GUIDE = [
  ["n ≤ 20", "O(2ⁿ) backtracking"],
  ["n ≤ 500", "O(n³)"],
  ["n ≤ 5,000", "O(n²)"],
  ["n ≤ 10⁵–10⁶", "O(n log n) or O(n)"],
  ["n ≤ 10⁹", "O(log n) or O(1)"],
  ["Sorted input", "binary search / two pointers"],
] as const;

function Section({ id, title, children, hint }: { id: string; title: string; children: React.ReactNode; hint?: string }) {
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

/** Collapsed by default so the answer isn't in view while you think. */
function Reveal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium outline-none hover:bg-muted/40 focus-visible:bg-muted">
        {title}
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t px-4 py-3">{children}</div>
    </details>
  );
}

function PatternHints({ problem, topicName, pattern }: { problem: Problem; topicName: string; pattern: Pattern }) {
  const hints: { label: string; body: React.ReactNode }[] = [
    {
      label: "Which area?",
      body: (
        <p>
          This is a <span className="font-medium text-foreground">{topicName}</span> problem. Which techniques from that area fit the input size?
        </p>
      ),
    },
    {
      label: "What to notice in the statement",
      body: (
        <ul className="list-disc space-y-1 pl-5">
          {pattern.signals.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ),
    },
    {
      label: "The pattern",
      body: (
        <p>
          <span className="font-medium text-foreground">{pattern.name}</span>. {pattern.approach}
        </p>
      ),
    },
    { label: "Key idea for this problem", body: <p>{problem.takeaway}</p> },
  ];
  const [shown, setShown] = useState(0);

  return (
    <div className="space-y-2">
      {hints.slice(0, shown).map((h, i) => (
        <Panel key={h.label} className="flex gap-3 p-4 text-sm leading-relaxed text-muted-foreground">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-warning/15 font-mono text-xs text-warning">{i + 1}</span>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-foreground">{h.label}</p>
            {h.body}
          </div>
        </Panel>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        {shown < hints.length ? (
          <>
            <Button variant="outline" onClick={() => setShown(shown + 1)}>
              <Lightbulb data-icon="inline-start" /> {shown ? "Next hint" : "Show a hint"} ({shown + 1}/{hints.length})
            </Button>
            {shown < hints.length - 1 && (
              <Button variant="ghost" onClick={() => setShown(hints.length)}>
                Show all
              </Button>
            )}
          </>
        ) : (
          <Button variant="ghost" onClick={() => setShown(0)}>
            Hide hints
          </Button>
        )}
      </div>
    </div>
  );
}

function useTimer() {
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (start === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [start]);
  const elapsed = start === null ? 0 : Math.max(0, Math.round((now - start) / 1000));
  return {
    running: start !== null,
    elapsed,
    start: () => {
      setStart(Date.now());
      setNow(Date.now());
    },
    /** Stops the timer and returns the exact seconds elapsed (0 if it wasn't running). */
    stop: () => {
      const e = start === null ? 0 : Math.max(0, Math.round((Date.now() - start) / 1000));
      setStart(null);
      return e;
    },
  };
}

export function ProblemWorkspace({ slug }: { slug: string }) {
  const item = useCatalogItem(slug);
  const hydrated = useHydrated();
  if (!hydrated) return <WorkspaceSkeleton />;
  if (!item) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Problem not found"
        description="It may have been a custom problem that was deleted."
        action={
          <Link href="/problems" className={buttonVariants({ size: "sm" })}>
            Back to problems
          </Link>
        }
      />
    );
  }
  return <Workspace item={item} />;
}

function Workspace({ item }: { item: CatalogItem }) {
  const { problem, topic, pattern, url, platform, custom } = item;
  const progress = useProgress();
  const catalog = useCatalog();
  const router = useRouter();
  const e: Entry = progress[problem.slug] ?? blankEntry();
  const set = (patch: Partial<Entry>) => updateEntry(problem.slug, patch, problem.title);
  const timer = useTimer();
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = displayStatus(e);
  const similar = catalog.filter((x) => x.pattern.id === pattern.id && x.problem.slug !== problem.slug);

  const solved = isSolved(e);
  const solve = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    timer.start();
    toast("Timer started", { description: "Stop it when you've solved it." });
  };
  const markAsSolved = (durationSec?: number) => {
    const before = e;
    markSolved(problem.slug, problem.title, durationSec);
    toast.success("Marked as solved", {
      action: { label: "Undo", onClick: () => updateEntry(problem.slug, before) },
    });
  };
  // Marking as solved always stops a running timer and records the time.
  const stopAndSolve = () => markAsSolved(timer.running ? timer.stop() : undefined);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/problems" className="hover:text-foreground">
            Problems
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/topics/${topic.id}`} className="hover:text-foreground">
            {topic.name}
          </Link>
        </nav>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{problem.title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted-foreground">
              <DifficultyBadge difficulty={problem.difficulty} />
              <span aria-hidden>·</span>
              <Link href={`/topics/${topic.id}`} className="hover:text-foreground">
                {topic.name}
              </Link>
              <span aria-hidden>·</span>
              <span className="font-mono text-xs">{platform}</span>
              {IMPORTANT_SET.has(problem.slug) && <Tag className="bg-primary/10 text-primary">Interview essential</Tag>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {timer.running ? (
              <Button onClick={stopAndSolve} variant="secondary" className="font-mono">
                <Pause data-icon="inline-start" /> {duration(timer.elapsed) || "0s"} · Stop & mark solved
              </Button>
            ) : (
              <Button onClick={solve} variant="secondary">
                <Play data-icon="inline-start" /> Solve
              </Button>
            )}
            {solved ? (
              <Button variant="secondary" disabled>
                <CircleCheck data-icon="inline-start" className="text-success" /> Solved
              </Button>
            ) : (
              <Button onClick={stopAndSolve}>
                <CircleCheck data-icon="inline-start" /> Mark as solved
              </Button>
            )}
            <Button variant="outline" onClick={() => setRevisionOpen(true)} aria-pressed={e.revisit}>
              {e.revisit ? <BookmarkCheck data-icon="inline-start" className="text-warning" /> : <BookmarkPlus data-icon="inline-start" />}
              {e.revisit ? "In revision" : "Add to revision"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => set({ starred: !e.starred })}
              aria-pressed={e.starred}
              aria-label={e.starred ? "Remove favourite" : "Favourite"}
            >
              <Star className={cn(e.starred && "fill-warning text-warning animate-pop")} />
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-10">
          <nav aria-label="Sections" className="flex gap-1 overflow-x-auto pb-1 lg:hidden">
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>

          <Section id="problem" title="Problem">
            <Panel className="space-y-3 p-4">
              <p className="text-sm leading-relaxed">
                Read the statement on {platform} first and note the input size: it tells you which complexity you need.
              </p>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Open the full statement on {platform} <ExternalLink className="size-3.5" aria-hidden />
                </a>
              )}
              <ul className="grid grid-cols-1 gap-2 pt-1 text-xs text-muted-foreground sm:grid-cols-3">
                {CONSTRAINT_GUIDE.map(([n, target]) => (
                  <li key={n} className="rounded-lg border bg-surface px-3 py-2">
                    <span className="font-mono text-foreground">{n}</span> → <span className="font-mono">{target}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </Section>

          <Section id="hints" title="Find the pattern" hint="Reveal one hint at a time">
            <PatternHints key={problem.slug} problem={problem} topicName={topic.name} pattern={pattern} />
          </Section>

          <Section id="solve" title="How to solve it" hint="Open only once you've tried">
            <div className="space-y-2">
              <Reveal title="The technique">
                <p className="text-sm leading-relaxed text-muted-foreground">{pattern.approach}</p>
                <Link href={`/patterns/${pattern.id}`} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  {pattern.name} in the pattern library <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </Reveal>
              {pattern.template && (
                <Reveal title="Template">
                  <CodeBlock code={pattern.template} language="python" />
                </Reveal>
              )}
              {pattern.pitfalls.length > 0 && (
                <Reveal title="Common mistakes with this pattern">
                  <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                    {pattern.pitfalls.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </Reveal>
              )}
              {pattern.variations.length > 0 && (
                <Reveal title="Variations to be ready for">
                  <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                    {pattern.variations.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </Reveal>
              )}
            </div>
          </Section>

          <Section id="similar" title="Similar problems" hint={`${similar.length} more with the same pattern`}>
            {similar.length ? (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {similar.map((x) => (
                  <li key={x.problem.slug}>
                    <Link
                      href={`/problems/${x.problem.slug}`}
                      className="flex items-center gap-3 rounded-lg border bg-surface px-3 py-2.5 outline-none transition-colors hover:border-foreground/15 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <StatusBadge status={displayStatus(progress[x.problem.slug])} compact />
                      <span className="min-w-0 flex-1 truncate text-sm">{x.problem.title}</span>
                      <DifficultyBadge difficulty={x.problem.difficulty} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No other problems in this pattern yet.</p>
            )}
            {pattern.transfer && (
              <div className="mt-4 rounded-lg border border-dashed p-3">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">The same idea also shows up in</p>
                <ul className="flex flex-wrap gap-1.5">
                  {pattern.transfer.map((t) => (
                    <li key={t}>
                      <Tag className="h-auto py-0.5 whitespace-normal">{t}</Tag>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          {custom && (
            <div className="border-t pt-6">
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 data-icon="inline-start" /> Delete this problem
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start" aria-label="Progress on this problem">
          <Panel className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={status} />
              {timer.running && (
                <span className="inline-flex items-center gap-1 font-mono text-xs text-primary">
                  <Timer className="size-3.5" aria-hidden /> {duration(timer.elapsed) || "0s"}
                </span>
              )}
            </div>
            <label className="block">
              <span className="text-xs text-muted-foreground">Next revision {isDue(e) && <span className="text-warning">· due</span>}</span>
              <input
                type="date"
                value={e.nextReview ?? ""}
                onChange={(ev) => set({ nextReview: ev.target.value || undefined })}
                className="mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2.5 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-input/30 dark:[color-scheme:dark]"
              />
            </label>
            {e.revisit && (
              <button
                type="button"
                onClick={() => setRevisionOpen(true)}
                className="block w-full rounded-lg bg-warning/10 px-3 py-2 text-left text-sm outline-none hover:bg-warning/15 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="block text-xs text-warning">To revise</span>
                <span className="whitespace-pre-wrap">{e.revisionNote || <span className="text-muted-foreground">No note. Click to add one.</span>}</span>
              </button>
            )}
          </Panel>
          <nav aria-label="On this page" className="hidden lg:block">
            <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">On this page</p>
            <ul className="space-y-0.5">
              {SECTIONS.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="block rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>

      <RevisionDialog slug={problem.slug} title={problem.title} open={revisionOpen} onOpenChange={setRevisionOpen} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{problem.title}”?</AlertDialogTitle>
            <AlertDialogDescription>Its notes, solution and history will be removed. This can’t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                removeCustomProblem(problem.slug);
                toast("Problem deleted");
                router.push("/problems");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading problem">
      <div className="space-y-3">
        <Shimmer className="h-3 w-32" />
        <Shimmer className="h-9 w-2/3" />
        <Shimmer className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Shimmer className="h-32 w-full rounded-xl" />
          <Shimmer className="h-40 w-full rounded-xl" />
          <Shimmer className="h-28 w-full rounded-xl" />
        </div>
        <Shimmer className="h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}

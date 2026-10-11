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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { CodeBlock, LANGUAGES } from "@/components/code-block";
import { RevisionDialog } from "@/components/revision-dialog";
import { DifficultyBadge, EmptyState, Panel, Shimmer, StatusBadge, Tag } from "@/components/kit";
import { NativeSelect } from "@/components/native-select";
import { IMPORTANT_SET } from "@/data/important";
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
  ["understanding", "Understanding"],
  ["recognition", "Pattern"],
  ["approach", "Approach"],
  ["complexity", "Complexity"],
  ["notes", "Notes"],
  ["mistakes", "Mistakes"],
  ["solution", "Solution"],
  ["similar", "Similar"],
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

function NoteField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={cn("resize-y bg-surface leading-relaxed", mono && "font-mono text-[13px]")}
      />
    </label>
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
    stop: () => {
      const e = elapsed;
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
  const [codeOpen, setCodeOpen] = useState(!!e.code);
  const [editingCode, setEditingCode] = useState(!e.code);
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
  const stopAndSolve = () => markAsSolved(timer.stop());

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
              <Link href={`/patterns/${pattern.id}`} className="hover:text-foreground">
                {pattern.name}
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
              <Button onClick={() => markAsSolved()}>
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

          <Section id="understanding" title="Problem understanding">
            <Panel className="space-y-4 p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                <p className="text-sm">
                  <span className="font-medium">Key idea: </span>
                  <span className="text-muted-foreground">{problem.takeaway}</span>
                </p>
              </div>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Read the full statement on {platform} <ExternalLink className="size-3.5" aria-hidden />
                </a>
              )}
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">
                  Restate it in your own words: inputs, output, constraints, and what makes it hard.
                </p>
                <NoteField
                  label="Problem in my own words"
                  value={e.statement}
                  onChange={(v) => set({ statement: v })}
                  placeholder="Given … return … such that …  Constraints: n ≤ 10⁵ (so O(n log n) or better)."
                  rows={3}
                />
              </div>
            </Panel>
          </Section>

          <Section id="recognition" title="Pattern recognition">
            <Link
              href={`/patterns/${pattern.id}`}
              className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.06] p-5 transition-colors hover:border-primary/40">
                <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden />
                <p className="font-mono text-[11px] uppercase tracking-wider text-primary">Pattern</p>
                <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold">
                  {pattern.name} <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden />
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pattern.approach}</p>
              </div>
            </Link>
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-medium text-muted-foreground">How to recognise this pattern</h3>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {pattern.signals.map((s) => (
                  <li key={s} className="flex gap-2 rounded-lg border bg-surface px-3 py-2 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <Section id="approach" title="Approach" hint="Autosaves">
            <NoteField
              label="My step-by-step approach"
              value={e.approach}
              onChange={(v) => set({ approach: v })}
              placeholder={"1. What did I notice in the statement?\n2. Which pattern does that point to?\n3. Steps of the algorithm…"}
              rows={6}
            />
            <div className="mt-3">
              <label htmlFor="insight" className="mb-1.5 block text-xs text-muted-foreground">
                Key insight (one line you want to remember)
              </label>
              <Input id="insight" value={e.insight} onChange={(ev) => set({ insight: ev.target.value })} placeholder="e.g. Shrink only while the window is invalid" />
            </div>
          </Section>

          <Section id="complexity" title="Complexity">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ["time", "Time"],
                  ["space", "Space"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="flex items-center gap-3 rounded-xl border bg-surface px-4 py-3">
                  <span className="w-12 text-xs text-muted-foreground">{label}</span>
                  <input
                    value={e[k]}
                    onChange={(ev) => set({ [k]: ev.target.value })}
                    placeholder="O(?)"
                    className="min-w-0 flex-1 bg-transparent font-mono text-base font-medium outline-none placeholder:text-muted-foreground/50"
                    aria-label={`${label} complexity`}
                  />
                </label>
              ))}
            </div>
          </Section>

          <Section id="notes" title="My notes">
            <NoteField label="Notes" value={e.notes} onChange={(v) => set({ notes: v })} placeholder="Anything worth remembering: edge cases, alternative approaches, follow-ups." rows={5} />
          </Section>

          <Section id="mistakes" title="Mistakes">
            <NoteField
              label="What did I miss?"
              value={e.mistakes}
              onChange={(v) => set({ mistakes: v })}
              placeholder="What did I miss? Off-by-one? Wrong pattern first? Forgot an edge case?"
              rows={4}
            />
          </Section>

          <Section id="solution" title="Solution">
            <Panel className="overflow-hidden">
              <button
                type="button"
                onClick={() => setCodeOpen((o) => !o)}
                aria-expanded={codeOpen}
                className="flex w-full items-center justify-between px-4 py-3 text-sm outline-none hover:bg-muted/40 focus-visible:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium">My solution</span>
                  {e.code ? (
                    <Tag mono>{LANGUAGES.find((l) => l.value === e.language)?.label ?? e.language}</Tag>
                  ) : (
                    <span className="text-xs text-muted-foreground">not added yet</span>
                  )}
                </span>
                <ChevronDown className={cn("size-4 transition-transform", codeOpen && "rotate-180")} aria-hidden />
              </button>
              {codeOpen && (
                <div className="space-y-3 border-t p-4">
                  <div className="flex items-center justify-between gap-2">
                    <NativeSelect aria-label="Language" value={e.language} onChange={(ev) => set({ language: ev.target.value })}>
                      {LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </NativeSelect>
                    {e.code && (
                      <Button variant="ghost" size="sm" onClick={() => setEditingCode((v) => !v)}>
                        {editingCode ? "Preview" : "Edit"}
                      </Button>
                    )}
                  </div>
                  {editingCode || !e.code ? (
                    <NoteField label="Solution code" value={e.code} onChange={(v) => set({ code: v })} placeholder="Paste or write your solution…" rows={12} mono />
                  ) : (
                    <CodeBlock code={e.code} language={e.language} />
                  )}
                </div>
              )}
            </Panel>
            {pattern.template && (
              <details className="group mt-3">
                <summary className="cursor-pointer list-none text-xs text-muted-foreground hover:text-foreground">
                  <span className="group-open:hidden">Show</span>
                  <span className="hidden group-open:inline">Hide</span> the {pattern.name} template
                </summary>
                <CodeBlock code={pattern.template} language="python" className="mt-2" />
              </details>
            )}
          </Section>

          <Section id="similar" title="Similar problems" hint={`${similar.length} more with ${pattern.name}`}>
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

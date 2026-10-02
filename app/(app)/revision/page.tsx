"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Brain, Check, Clock, Crown, PartyPopper, RotateCcw, ThumbsDown, TriangleAlert, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confidence, DifficultyBadge, EmptyState, PageHeader, Panel, Shimmer, Tag } from "@/components/kit";
import { useCatalog, type CatalogItem } from "@/lib/catalog";
import { relativeDay } from "@/lib/format";
import {
  isDue,
  isSolved,
  quickReview,
  reviewInterval,
  today,
  useHydrated,
  useProgress,
  type Entry,
  type QuickReview,
} from "@/lib/progress";
import { cn } from "@/lib/utils";

type Bucket = "due" | "first" | "second" | "weak" | "failed" | "mastered";

const BUCKETS: { id: Bucket; label: string; hint: string; test: (e: Entry) => boolean }[] = [
  { id: "due", label: "Due today", hint: "Scheduled reviews that have arrived, oldest first.", test: (e) => isDue(e) },
  { id: "first", label: "First revision", hint: "Solved once, never revisited. The first review locks it in.", test: (e) => isSolved(e) && e.revisitCount === 0 },
  { id: "second", label: "Second revision", hint: "Revisited once. One more good review and the gap stretches.", test: (e) => isSolved(e) && e.revisitCount === 1 },
  { id: "weak", label: "Weak", hint: "Low confidence (1–2) or flagged by you.", test: (e) => e.status !== "todo" && (e.revisit || (e.understanding > 0 && e.understanding <= 2)) },
  { id: "failed", label: "Previously failed", hint: "Attempts you couldn't finish. Retry from scratch.", test: (e) => e.failCount > 0 && e.status !== "mastered" },
  { id: "mastered", label: "Mastered", hint: "Confident across multiple revisions. Occasional check-ins only.", test: (e) => e.status === "mastered" },
];

const ACTIONS: { id: QuickReview; label: string; icon: typeof Check; variant: "default" | "secondary" | "outline" | "ghost"; hint: string }[] = [
  { id: "got-it", label: "Got it", icon: Check, variant: "default", hint: "Solved cleanly — push the next review out" },
  { id: "practice", label: "Need more practice", icon: Brain, variant: "secondary", hint: "Shaky — review again in a few days" },
  { id: "forgot", label: "Forgot", icon: ThumbsDown, variant: "outline", hint: "Couldn't recall — retry tomorrow" },
  { id: "later", label: "Review later", icon: Clock, variant: "ghost", hint: "Snooze for a day without logging" },
];

function ReviewCard({ item, entry }: { item: CatalogItem; entry: Entry }) {
  const { problem, pattern } = item;
  const lastSolved = entry.history.filter((h) => h.result !== "failed").at(-1)?.date;
  const act = (a: QuickReview) => {
    quickReview(problem.slug, a, problem.title);
    const label = ACTIONS.find((x) => x.id === a)!.label;
    toast(`${label}: ${problem.title}`, {
      description: a === "later" ? "Snoozed until tomorrow." : a === "forgot" ? "Back in the queue tomorrow." : "Next review rescheduled.",
    });
  };
  const due = isDue(entry);

  return (
    <Panel className="p-4 transition-colors">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/problems/${problem.slug}`} className="truncate font-medium outline-none hover:text-primary focus-visible:underline">
              {problem.title}
            </Link>
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Tag>{pattern.name}</Tag>
            <span>
              Last solved <span className="font-mono text-foreground">{relativeDay(lastSolved)}</span>
            </span>
            <span>
              Attempts <span className="font-mono text-foreground">{entry.history.length}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              Confidence <Confidence value={entry.understanding} />
            </span>
            <span>
              Next{" "}
              <span className={cn("font-mono", due ? "text-warning" : "text-foreground")}>
                {due ? `due ${relativeDay(entry.nextReview)}` : relativeDay(entry.nextReview)}
              </span>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Review ${problem.title}`}>
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Button key={a.id} size="sm" variant={a.variant} onClick={() => act(a.id)} title={a.hint}>
                <Icon data-icon="inline-start" /> {a.label}
              </Button>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

export default function RevisionPage() {
  const progress = useProgress();
  const catalog = useCatalog();
  const hydrated = useHydrated();
  const [bucket, setBucket] = useState<Bucket>("due");

  const lists = Object.fromEntries(
    BUCKETS.map((b) => [
      b.id,
      catalog
        .filter((x) => progress[x.problem.slug] && b.test(progress[x.problem.slug]))
        .sort((a, c) => (progress[a.problem.slug].nextReview ?? "9999").localeCompare(progress[c.problem.slug].nextReview ?? "9999")),
    ]),
  ) as Record<Bucket, CatalogItem[]>;

  const t = today();
  const upcomingWeek = catalog.filter((x) => {
    const e = progress[x.problem.slug];
    return e?.nextReview && e.nextReview > t && e.nextReview <= relativeLimit(t);
  }).length;
  const current = BUCKETS.find((b) => b.id === bucket)!;
  const items = lists[bucket];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Revision"
        subtitle="Spaced repetition for problems: review just before you'd forget."
        actions={
          hydrated && (
            <div className="flex gap-2 text-sm">
              <Panel className="px-3 py-1.5">
                <span className="font-mono font-semibold text-warning">{lists.due.length}</span> <span className="text-muted-foreground">due</span>
              </Panel>
              <Panel className="px-3 py-1.5">
                <span className="font-mono font-semibold">{upcomingWeek}</span> <span className="text-muted-foreground">next 7 days</span>
              </Panel>
            </div>
          )
        }
      />

      <Panel className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Interval ladder</span>
        {[1, 2, 3, 4, 5].map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <Confidence value={c} /> <span className="font-mono">{reviewInterval(c, 0)}d</span>
          </span>
        ))}
        <span>· each successful revision stretches the gap by 50%.</span>
      </Panel>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Revision categories">
        {BUCKETS.map((b) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={bucket === b.id}
            onClick={() => setBucket(b.id)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              bucket === b.id ? "border-primary/40 bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {b.label}
            <span className={cn("rounded-md px-1.5 font-mono text-[11px]", bucket === b.id ? "bg-primary/20" : "bg-muted")}>
              {hydrated ? lists[b.id].length : "·"}
            </span>
          </button>
        ))}
      </div>

      <section role="tabpanel" aria-label={current.label} className="space-y-3">
        <p className="text-sm text-muted-foreground">{current.hint}</p>
        {!hydrated ? (
          Array.from({ length: 3 }, (_, i) => <Shimmer key={i} className="h-20 w-full rounded-xl" />)
        ) : items.length ? (
          <ul className="space-y-2">
            {items.map((x) => (
              <li key={x.problem.slug}>
                <ReviewCard item={x} entry={progress[x.problem.slug]} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={bucket === "due" ? PartyPopper : bucket === "mastered" ? Crown : bucket === "failed" ? Undo2 : bucket === "weak" ? TriangleAlert : RotateCcw}
            title={bucket === "due" ? "No revision tasks today" : `Nothing in “${current.label}”`}
            description={
              bucket === "due"
                ? "You're caught up. Solve something new — it joins the schedule automatically."
                : "Log attempts on problems and they'll be sorted into these buckets."
            }
            action={
              <Link href="/problems" className="text-sm font-medium text-primary hover:underline">
                Browse problems →
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}

function relativeLimit(t: string) {
  const d = new Date(`${t}T12:00:00`);
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString("en-CA");
}

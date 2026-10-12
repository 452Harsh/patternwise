"use client";

import Link from "next/link";
import { useState } from "react";
import { PartyPopper, RotateCcw } from "lucide-react";
import { EmptyState, PageHeader, Panel, Shimmer, Tag } from "@/components/kit";
import { SDQuickReview, SDRevisionButton, TrackTag } from "@/components/sd/sd-kit";
import type { SDItem } from "@/data/sd";
import { relativeDay } from "@/lib/format";
import { isSDDue, useHydrated, useStore, type SDEntry } from "@/lib/progress";
import { useSDItems } from "@/lib/sd";
import { cn } from "@/lib/utils";

type Queue = "due" | "hld-concepts" | "hld-problems" | "lld-concepts" | "lld-patterns" | "lld-problems" | "diagrams";

const QUEUES: { id: Queue; label: string; hint: string; test: (x: SDItem) => boolean }[] = [
  { id: "due", label: "Due today", hint: "Items you added to revision whose date has arrived, oldest first.", test: () => true },
  { id: "hld-concepts", label: "HLD concepts", hint: "Distributed-systems concepts and architecture patterns.", test: (x) => x.track === "hld" && (x.kind === "concept" || x.kind === "pattern") },
  { id: "hld-problems", label: "HLD problems", hint: "Redesign them from a blank page.", test: (x) => x.track === "hld" && x.kind === "problem" },
  { id: "lld-concepts", label: "LLD concepts", hint: "OOP and design principles.", test: (x) => x.track === "lld" && x.kind === "concept" },
  { id: "lld-patterns", label: "LLD patterns", hint: "Recall intent, structure and a use case.", test: (x) => x.track === "lld" && x.kind === "pattern" },
  { id: "lld-problems", label: "LLD problems", hint: "Re-sketch classes and relationships.", test: (x) => x.track === "lld" && x.kind === "problem" },
  { id: "diagrams", label: "Architecture diagrams", hint: "Could you redraw it from memory?", test: (x) => x.kind === "diagram" },
];

function ReviewRow({ item, entry }: { item: SDItem; entry: SDEntry }) {
  const due = isSDDue(entry);
  return (
    <Panel className="p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={item.href} className="truncate font-medium outline-none hover:text-primary focus-visible:underline">
              {item.title}
            </Link>
            <TrackTag track={item.track} />
            <Tag>{item.group}</Tag>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Last reviewed <span className="font-mono text-foreground">{relativeDay(entry.lastReviewed)}</span>
            </span>
            <span>
              Next <span className={cn("font-mono", due ? "text-warning" : "text-foreground")}>{due ? `due ${relativeDay(entry.nextReview)}` : relativeDay(entry.nextReview)}</span>
            </span>
          </div>
          {entry.revisionNote && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-warning/10 px-3 py-2 text-sm">{entry.revisionNote}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <SDQuickReview itemKey={item.key} title={item.title} />
          <SDRevisionButton itemKey={item.key} title={item.title} />
        </div>
      </div>
    </Panel>
  );
}

export default function SDRevisionPage() {
  const state = useStore();
  const items = useSDItems();
  const hydrated = useHydrated();
  const [queue, setQueue] = useState<Queue>("due");

  // Only items added to revision (same as DSA).
  const reviewed = items.filter((x) => state.sd[x.key]?.revisit);
  const lists = Object.fromEntries(
    QUEUES.map((q) => [
      q.id,
      reviewed
        .filter((x) => q.test(x) && (q.id !== "due" || isSDDue(state.sd[x.key])))
        .sort((a, b) => (state.sd[a.key].nextReview ?? "9999").localeCompare(state.sd[b.key].nextReview ?? "9999")),
    ]),
  ) as Record<Queue, SDItem[]>;
  const current = QUEUES.find((q) => q.id === queue)!;
  const rows = lists[queue];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="System Design"
        title="Revision"
        subtitle="Concepts, patterns, problems and diagrams you added to revision, on the days you chose."
        actions={
          hydrated && (
            <Panel className="px-3 py-1.5 text-sm">
              <span className="font-mono font-semibold text-warning">{lists.due.length}</span> <span className="text-muted-foreground">due</span>
            </Panel>
          )
        }
      />

      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Revision queues">
        {QUEUES.map((q) => (
          <button
            key={q.id}
            type="button"
            role="tab"
            aria-selected={queue === q.id}
            onClick={() => setQueue(q.id)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              queue === q.id ? "border-primary/40 bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {q.label}
            <span className={cn("rounded-md px-1.5 font-mono text-[11px]", queue === q.id ? "bg-primary/20" : "bg-muted")}>{hydrated ? lists[q.id].length : "·"}</span>
          </button>
        ))}
      </div>

      <section role="tabpanel" aria-label={current.label} className="space-y-3">
        <p className="text-sm text-muted-foreground">{current.hint}</p>
        {!hydrated ? (
          Array.from({ length: 3 }, (_, i) => <Shimmer key={i} className="h-20 w-full rounded-xl" />)
        ) : rows.length ? (
          <ul className="space-y-2">
            {rows.map((x) => (
              <li key={x.key}>
                <ReviewRow item={x} entry={state.sd[x.key]} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={queue === "due" ? PartyPopper : RotateCcw}
            title={queue === "due" ? "No revision tasks today" : `Nothing in “${current.label}” yet`}
            description="Use “Add to revision” on a concept, pattern, problem or diagram to put it here."
            action={
              <Link href="/system-design/concepts" className="text-sm font-medium text-primary hover:underline">
                Browse concepts →
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}

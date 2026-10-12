"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { BookmarkCheck, BookmarkPlus, Brain, Check, CircleCheck, CircleDashed, Clock, RotateCcw, Star, ThumbsDown, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DifficultyBadge, EmptyState, Panel, Shimmer, Tag } from "@/components/kit";
import { RevisionDialogFor } from "@/components/revision-dialog";
import type { SDItem } from "@/data/sd";
import { relativeDay } from "@/lib/format";
import {
  addSDToRevision,
  blankSD,
  isSDDone,
  isSDDue,
  markSDComplete,
  removeSDFromRevision,
  sdQuickReview,
  unmarkSDComplete,
  updateSD,
  useHydrated,
  useStore,
  type QuickReview,
  type SDEntry,
  type SDHistoryKind,
} from "@/lib/progress";
import { cn } from "@/lib/utils";

/** Display status, same three states as DSA: not started, completed, needs revision. */
export type SDDisplayStatus = "todo" | "done" | "revision";

export const sdDisplayStatus = (e: SDEntry | undefined): SDDisplayStatus => (e?.revisit ? "revision" : isSDDone(e) ? "done" : "todo");

export const SD_STATUS_META: Record<SDDisplayStatus, { label: string; icon: LucideIcon; className: string }> = {
  todo: { label: "Not started", icon: CircleDashed, className: "text-muted-foreground" },
  done: { label: "Completed", icon: CircleCheck, className: "text-success" },
  revision: { label: "Needs revision", icon: RotateCcw, className: "text-warning" },
};

export function SDStatusBadge({ entry, compact }: { entry?: SDEntry; compact?: boolean }) {
  const m = SD_STATUS_META[sdDisplayStatus(entry)];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", m.className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className={cn(compact && "sr-only")}>{m.label}</span>
    </span>
  );
}

export const TrackTag = ({ track }: { track: "hld" | "lld" | "dsa" }) => (
  <span
    className={cn(
      "inline-flex h-5 items-center rounded-md px-1.5 font-mono text-[10px] font-semibold uppercase ring-1 ring-inset",
      track === "hld" && "bg-info/10 text-info ring-info/20",
      track === "lld" && "bg-primary/10 text-primary ring-primary/20",
      track === "dsa" && "bg-success/10 text-success ring-success/20",
    )}
  >
    {track}
  </span>
);

const sdEntry = (state: ReturnType<typeof useStore>, key: string) => state.sd[key] ?? blankSD();

/** Quick actions for the revision queue, the same four as DSA. */
const QUICK_ACTIONS: { id: QuickReview; label: string; icon: LucideIcon; variant: "default" | "secondary" | "outline" | "ghost"; hint: string; done: string }[] = [
  { id: "got-it", label: "Got it", icon: Check, variant: "default", hint: "Remembered it: push the next review out", done: "Next review rescheduled." },
  { id: "practice", label: "Need more practice", icon: Brain, variant: "secondary", hint: "Shaky: review again in a few days", done: "Next review rescheduled." },
  { id: "forgot", label: "Forgot", icon: ThumbsDown, variant: "outline", hint: "Couldn't recall: back tomorrow", done: "Back in the queue tomorrow." },
  { id: "later", label: "Review later", icon: Clock, variant: "ghost", hint: "Snooze for a day", done: "Snoozed until tomorrow." },
];

export function SDQuickReview({ itemKey, title }: { itemKey: string; title: string }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Review ${title}`}>
      {QUICK_ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <Button
            key={a.id}
            size="sm"
            variant={a.variant}
            title={a.hint}
            onClick={() => {
              sdQuickReview(itemKey, a.id, title);
              toast(`${a.label}: ${title}`, { description: a.done });
            }}
          >
            <Icon data-icon="inline-start" /> {a.label}
          </Button>
        );
      })}
    </div>
  );
}

/** "Add to revision" / "In revision": opens the shared revision dialog (note + days). */
export function SDRevisionButton({ itemKey, title, block }: { itemKey: string; title: string; block?: boolean }) {
  const e = sdEntry(useStore(), itemKey);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} aria-pressed={!!e.revisit} className={cn(block && "w-full")}>
        {e.revisit ? <BookmarkCheck data-icon="inline-start" className="text-warning" /> : <BookmarkPlus data-icon="inline-start" />}
        {e.revisit ? "In revision" : "Add to revision"}
      </Button>
      <RevisionDialogFor
        title={title}
        open={open}
        onOpenChange={setOpen}
        target={{
          inRevision: !!e.revisit,
          note: e.revisionNote,
          nextReview: e.nextReview,
          save: (note, days) => addSDToRevision(itemKey, note, days, title),
          remove: () => removeSDFromRevision(itemKey),
        }}
      />
    </>
  );
}

/** The revision note and next date, shown on item pages once the item is in revision. */
function RevisionInfo({ e }: { e: SDEntry }) {
  if (!e.revisit) return null;
  const due = isSDDue(e);
  return (
    <div className="space-y-2 rounded-lg bg-warning/10 px-3 py-2 text-sm">
      <p className="flex items-center justify-between text-xs">
        <span className="text-warning">To revise</span>
        <span className={cn("font-mono", due ? "text-warning" : "text-muted-foreground")}>{due ? "due" : relativeDay(e.nextReview)}</span>
      </p>
      <p className="whitespace-pre-wrap">{e.revisionNote || <span className="text-muted-foreground">No note. Use “In revision” to add one.</span>}</p>
    </div>
  );
}

export function SDNotes({ itemKey, title, placeholder, rows = 6 }: { itemKey: string; title: string; placeholder?: string; rows?: number }) {
  const e = sdEntry(useStore(), itemKey);
  return (
    <Textarea
      value={e.notes}
      onChange={(ev) => updateSD(itemKey, { notes: ev.target.value }, title)}
      rows={rows}
      placeholder={placeholder ?? "Explain it in your own words. What would you say in an interview?"}
      className="resize-y bg-surface leading-relaxed"
      aria-label={`My notes for ${title}`}
    />
  );
}

export function StarToggle({ itemKey, title }: { itemKey: string; title: string }) {
  const e = sdEntry(useStore(), itemKey);
  return (
    <button
      type="button"
      onClick={() => updateSD(itemKey, { starred: !e.starred })}
      aria-pressed={e.starred}
      aria-label={e.starred ? `Unfavourite ${title}` : `Favourite ${title}`}
      className={cn(
        "grid size-8 place-items-center rounded-lg border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        e.starred ? "text-warning" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Star className={cn("size-4", e.starred && "fill-current animate-pop")} aria-hidden />
    </button>
  );
}

/** Progress card for problem pages: status, mark as practiced, add to revision. */
export function SDProgressCard({ itemKey, title }: { itemKey: string; title: string }) {
  const e = sdEntry(useStore(), itemKey);
  return (
    <Panel className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <SDStatusBadge entry={e} />
        <StarToggle itemKey={itemKey} title={title} />
      </div>
      <CompleteButton itemKey={itemKey} title={title} kind="practice" block />
      <SDRevisionButton itemKey={itemKey} title={title} block />
      <RevisionInfo e={e} />
    </Panel>
  );
}

/** Generic list for SD items (concepts, patterns, problems, diagrams). */
export function SDItemList({ items, empty, showTrack = true }: { items: SDItem[]; empty?: React.ReactNode; showTrack?: boolean }) {
  const state = useStore();
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <Panel className="divide-y" aria-busy="true">
        {Array.from({ length: Math.min(items.length || 5, 6) }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Shimmer className="size-4 rounded-full" />
            <Shimmer className="h-4 max-w-64 flex-1" />
            <Shimmer className="h-4 w-16" />
          </div>
        ))}
      </Panel>
    );
  }
  if (!items.length) return <>{empty ?? <EmptyState icon={CircleDashed} title="Nothing here yet" />}</>;
  return (
    <Panel className="divide-y overflow-hidden">
      {items.map((x) => {
        const e = state.sd[x.key];
        const due = isSDDue(e);
        return (
          <Link
            key={x.key}
            href={x.href}
            className="flex items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted"
          >
            <SDStatusBadge entry={e} compact />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{x.title}</span>
                {e?.starred && <Star className="size-3 shrink-0 fill-warning text-warning" aria-label="Favourite" />}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{x.summary}</span>
            </span>
            <span className="hidden shrink-0 items-center gap-2 sm:flex">
              {showTrack && <TrackTag track={x.track} />}
              <Tag>{x.group}</Tag>
              {x.difficulty && <DifficultyBadge difficulty={x.difficulty} />}
            </span>
            <span className={cn("w-16 shrink-0 text-right font-mono text-[11px]", due ? "text-warning" : "text-muted-foreground")}>
              {due ? "due" : e?.revisit && e.nextReview ? relativeDay(e.nextReview) : "—"}
            </span>
          </Link>
        );
      })}
    </Panel>
  );
}

/** One-click "Mark as complete" (or "Mark as practiced" for problems), with Undo. */
export function CompleteButton({ itemKey, title, block, kind }: { itemKey: string; title: string; block?: boolean; kind?: SDHistoryKind }) {
  const e = sdEntry(useStore(), itemKey);
  const doneLabel = kind === "practice" ? "Practiced" : "Completed";
  if (isSDDone(e)) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={cn("inline-flex h-9 items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 text-sm font-medium text-success", block && "flex-1 justify-center")}
          role="status"
        >
          <CircleCheck className="size-4 animate-pop" aria-hidden />
          {doneLabel}
        </span>
        <button
          type="button"
          onClick={() => {
            unmarkSDComplete(itemKey);
            toast(`${title} marked as not ${doneLabel.toLowerCase()}`);
          }}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Undo
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        markSDComplete(itemKey, title, kind);
        toast.success(`${title} ${doneLabel.toLowerCase()}`);
      }}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-ring",
        block && "w-full justify-center",
      )}
    >
      <CircleCheck className="size-4" aria-hidden /> {kind === "practice" ? "Mark as practiced" : "Mark as complete"}
    </button>
  );
}

/** "Your progress" panel for concept and pattern pages: complete, favourite, revision. */
export function SDProgressPanel({ itemKey, title }: { itemKey: string; title: string }) {
  const e = sdEntry(useStore(), itemKey);
  return (
    <Panel className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Your progress</p>
        <StarToggle itemKey={itemKey} title={title} />
      </div>
      <CompleteButton itemKey={itemKey} title={title} block />
      <SDRevisionButton itemKey={itemKey} title={title} block />
      <RevisionInfo e={e} />
    </Panel>
  );
}

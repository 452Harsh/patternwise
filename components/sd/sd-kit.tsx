"use client";

import Link from "next/link";
import { toast } from "sonner";
import { CircleCheck, CircleDashed, CircleDot, Crown, Star, type LucideIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Confidence, DifficultyBadge, EmptyState, Panel, Shimmer, Tag } from "@/components/kit";
import type { SDItem } from "@/data/sd";
import { relativeDay } from "@/lib/format";
import {
  SD_CONFIDENCE,
  SD_REVIEW_MARKS,
  blankSD,
  isSDDue,
  markSDComplete,
  rateSD,
  setSDReviews,
  unmarkSDComplete,
  updateSD,
  useHydrated,
  useStore,
  type SDEntry,
  type SDHistoryKind,
  type SDStatus,
} from "@/lib/progress";
import { cn } from "@/lib/utils";

export const SD_STATUS_META: Record<SDStatus, { label: string; icon: LucideIcon; className: string }> = {
  todo: { label: "Not started", icon: CircleDashed, className: "text-muted-foreground" },
  learning: { label: "Learning", icon: CircleDot, className: "text-info" },
  done: { label: "Completed", icon: CircleCheck, className: "text-success" },
  mastered: { label: "Mastered", icon: Crown, className: "text-primary" },
};

export function SDStatusBadge({ entry, compact }: { entry?: SDEntry; compact?: boolean }) {
  const m = SD_STATUS_META[entry?.status ?? "todo"];
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

/** Concept confidence scale: Don't know → Can apply. Rating also schedules a review. */
export function ConfidencePicker({ itemKey, title }: { itemKey: string; title: string }) {
  const e = sdEntry(useStore(), itemKey);
  return (
    <div role="radiogroup" aria-label={`Your confidence with ${title}`} className="flex flex-wrap gap-1.5">
      {SD_CONFIDENCE.slice(1).map((label, i) => {
        const value = i + 1;
        const active = e.confidence === value;
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              rateSD(itemKey, value, { title });
              toast.success(`${title}: ${label}`, { description: "Next review scheduled." });
            }}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-primary/50 bg-primary/12 font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Confidence value={value} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Revision marks: Forgot → Mastered. */
export function ReviewButtons({
  itemKey,
  title,
  kind = "review",
  size = "default",
  onDone,
}: {
  itemKey: string;
  title: string;
  kind?: SDHistoryKind;
  size?: "default" | "sm";
  onDone?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Review ${title}`}>
      {SD_REVIEW_MARKS.map((m) => (
        <button
          key={m.rating}
          type="button"
          onClick={() => {
            rateSD(itemKey, m.rating, { title, kind });
            toast(`${m.label}: ${title}`, { description: m.rating <= 1 ? "Back tomorrow." : "Next review rescheduled." });
            onDone?.();
          }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            size === "sm" ? "h-7 px-2 text-xs" : "h-8 px-3 text-sm",
            m.rating <= 1 && "hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive",
            m.rating === 2 && "hover:border-warning/40 hover:bg-warning/10 hover:text-warning",
            m.rating === 3 && "hover:bg-muted",
            m.rating >= 4 && "hover:border-success/40 hover:bg-success/10 hover:text-success",
          )}
        >
          <Confidence value={m.rating} />
          {m.label}
        </button>
      ))}
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

/** Small progress summary card for an item page. */
export function SDProgressCard({ itemKey }: { itemKey: string }) {
  const e = sdEntry(useStore(), itemKey);
  const due = isSDDue(e);
  return (
    <Panel className="space-y-3 p-4">
      <SDStatusBadge entry={e} />
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Confidence</dt>
          <dd className="flex h-6 items-center" title={SD_CONFIDENCE[e.confidence]}>
            <Confidence value={e.confidence} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Reviews</dt>
          <dd className="font-mono">{e.reviewCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Last reviewed</dt>
          <dd className="font-mono">{relativeDay(e.lastReviewed)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Next review</dt>
          <dd className={cn("font-mono", due && "text-warning")}>{e.reviewOff ? "Off" : due ? "due" : relativeDay(e.nextReview)}</dd>
        </div>
      </dl>
      {e.history.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setSDReviews(itemKey, !!e.reviewOff);
            toast(e.reviewOff ? "Reviews resumed" : "Reviews stopped", {
              description: e.reviewOff ? "It's back on your revision schedule." : "It won't come up in Revision any more.",
            });
          }}
          className="w-full rounded-lg border px-3 py-1.5 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {e.reviewOff ? "Resume reviews" : "Stop reviews — I'm done with this"}
        </button>
      )}
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
            <span className="hidden w-16 shrink-0 justify-end md:flex">
              <Confidence value={e?.confidence ?? 0} />
            </span>
            <span className={cn("w-16 shrink-0 text-right font-mono text-[11px]", due ? "text-warning" : "text-muted-foreground")}>
              {due ? "due" : e?.nextReview ? relativeDay(e.nextReview) : "—"}
            </span>
          </Link>
        );
      })}
    </Panel>
  );
}

/** Prominent "Mark as complete" toggle for concept and pattern pages. */
export function CompleteButton({ itemKey, title, block }: { itemKey: string; title: string; block?: boolean }) {
  const e = sdEntry(useStore(), itemKey);
  const done = e.status === "done" || e.status === "mastered";
  if (done) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={cn("inline-flex h-9 items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 text-sm font-medium text-success", block && "flex-1 justify-center")}
          role="status"
        >
          <CircleCheck className="size-4 animate-pop" aria-hidden />
          {e.status === "mastered" ? "Mastered" : "Completed"}
        </span>
        {e.status === "done" && (
          <button
            type="button"
            onClick={() => {
              unmarkSDComplete(itemKey);
              toast(`${title} marked as not complete`);
            }}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Undo
          </button>
        )}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        markSDComplete(itemKey, title);
        toast.success(`${title} completed`, { description: "Added to your revision schedule." });
      }}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-ring",
        block && "w-full justify-center",
      )}
    >
      <CircleCheck className="size-4" aria-hidden /> Mark as complete
    </button>
  );
}

const CONFIDENCE_HINTS = ["", "Never seen it", "Heard of it", "Get the idea", "Could teach it", "Use it in designs"];

/**
 * Single "Your progress" panel for concept and pattern pages: completion, favourite,
 * confidence (which schedules reviews), review stats and the stop/resume reviews switch.
 */
export function SDProgressPanel({ itemKey, title, prompt }: { itemKey: string; title: string; prompt?: string }) {
  const e = sdEntry(useStore(), itemKey);
  const due = isSDDue(e);
  return (
    <Panel className="overflow-hidden">
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Your progress</p>
          <StarToggle itemKey={itemKey} title={title} />
        </div>
        <CompleteButton itemKey={itemKey} title={title} block />
      </div>

      <div className="border-t p-4">
        <p className="text-sm font-medium">How well do you know it?</p>
        <p className="mb-3 text-xs text-muted-foreground">{prompt ?? "Pick honestly — it decides when this comes back for review."}</p>
        <div role="radiogroup" aria-label={`Your confidence with ${title}`} className="space-y-1">
          {SD_CONFIDENCE.slice(1).map((label, i) => {
            const value = i + 1;
            const active = e.confidence === value;
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  rateSD(itemKey, value, { title });
                  toast.success(`${title}: ${label}`, { description: e.reviewOff ? "Reviews are off for this item." : "Next review scheduled." });
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-primary/50 bg-primary/10" : "border-transparent hover:bg-muted",
                )}
              >
                <Confidence value={value} className="w-12 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm", active ? "font-medium text-foreground" : "text-foreground/90")}>{label}</span>
                  <span className="block text-[11px] text-muted-foreground">{CONFIDENCE_HINTS[value]}</span>
                </span>
                {active && <CircleCheck className="size-4 shrink-0 text-primary" aria-hidden />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 border-t bg-surface/60 p-4">
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-[11px] text-muted-foreground">Reviews</dt>
            <dd className="font-mono">{e.reviewCount}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Last reviewed</dt>
            <dd className="font-mono">{relativeDay(e.lastReviewed)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Next review</dt>
            <dd className={cn("font-mono", due && "text-warning")}>{e.reviewOff ? "Off" : due ? "due" : relativeDay(e.nextReview)}</dd>
          </div>
        </dl>
        {e.history.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSDReviews(itemKey, !!e.reviewOff);
              toast(e.reviewOff ? "Reviews resumed" : "Reviews stopped", {
                description: e.reviewOff ? "It's back on your revision schedule." : "It won't come up in Revision any more.",
              });
            }}
            className="text-xs text-muted-foreground underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:underline"
          >
            {e.reviewOff ? "Resume reviews" : "Stop reviews — I'm done with this"}
          </button>
        )}
      </div>
    </Panel>
  );
}

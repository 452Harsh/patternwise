"use client";

import Link from "next/link";
import { BookOpen, CircleCheck, Crown, History, Library, Network, NotebookPen, Presentation, RotateCcw, Flag, CircleX, Timer, type LucideIcon } from "lucide-react";
import { EmptyState, Panel } from "@/components/kit";
import { timeAgo } from "@/lib/format";
import { sdHref } from "@/data/sd";
import { useStore, type EventType } from "@/lib/progress";
import { cn } from "@/lib/utils";

const META: Record<EventType, { icon: LucideIcon; tone: string }> = {
  solved: { icon: CircleCheck, tone: "text-success bg-success/10" },
  reviewed: { icon: RotateCcw, tone: "text-info bg-info/10" },
  failed: { icon: CircleX, tone: "text-destructive bg-destructive/10" },
  mastered: { icon: Crown, tone: "text-primary bg-primary/10" },
  note: { icon: NotebookPen, tone: "text-muted-foreground bg-muted" },
  pattern: { icon: Library, tone: "text-primary bg-primary/10" },
  flagged: { icon: Flag, tone: "text-warning bg-warning/10" },
  mock: { icon: Presentation, tone: "text-info bg-info/10" },
  "sd-studied": { icon: BookOpen, tone: "text-info bg-info/10" },
  "sd-reviewed": { icon: RotateCcw, tone: "text-info bg-info/10" },
  "sd-practiced": { icon: Network, tone: "text-success bg-success/10" },
  "sd-mastered": { icon: Crown, tone: "text-primary bg-primary/10" },
  "sd-note": { icon: NotebookPen, tone: "text-muted-foreground bg-muted" },
  "sd-session": { icon: Timer, tone: "text-warning bg-warning/10" },
};

/** Which part of the app an event belongs to. */
export const eventScope = (type: EventType) => (type.startsWith("sd-") ? "sd" : "dsa");

export function ActivityFeed({ limit = 8, scope }: { limit?: number; scope?: "dsa" | "sd" }) {
  const events = useStore()
    .events.filter((e) => !scope || eventScope(e.type) === scope)
    .slice(0, limit);

  if (!events.length) {
    return (
      <EmptyState
        icon={History}
        title="No activity yet"
        description="Solves, reviews, notes and mastered patterns will show up here."
      />
    );
  }

  return (
    <Panel className="p-4">
      <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[13px] before:w-px before:bg-border">
        {events.map((ev) => {
          const m = META[ev.type];
          const Icon = m.icon;
          const href = ev.sdKey ? sdHref(ev.sdKey) : ev.slug ? `/problems/${ev.slug}` : ev.patternId ? `/patterns/${ev.patternId}` : undefined;
          return (
            <li key={ev.id} className="relative flex items-start gap-3">
              <span className={cn("relative z-10 grid size-7 shrink-0 place-items-center rounded-full ring-4 ring-card", m.tone)}>
                <Icon className="size-3.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                {href ? (
                  <Link href={href} className="block truncate text-sm outline-none hover:text-primary focus-visible:underline">
                    {ev.text}
                  </Link>
                ) : (
                  <p className="truncate text-sm">{ev.text}</p>
                )}
                <time dateTime={ev.at} className="font-mono text-[11px] text-muted-foreground">
                  {timeAgo(ev.at)}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BookOpenText, Check, Component, Library, Network, RotateCcw, Sparkles, type LucideIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DifficultyBadge, EmptyState, Panel, Shimmer } from "@/components/kit";
import { patternIndex } from "@/data/curriculum";
import { useCatalog } from "@/lib/catalog";
import { useSDItems } from "@/lib/sd";
import { TrackTag } from "@/components/sd/sd-kit";
import { buildDailyPlan } from "@/lib/plan";
import { isSolved, replacePlan, savePlan, toggleDaily, today, useHydrated, useStore, type PlanTask, type State } from "@/lib/progress";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<PlanTask["kind"], LucideIcon> = {
  new: Sparkles,
  pattern: Library,
  failed: RotateCcw,
  theory: BookOpenText,
  hld: Network,
  lld: Component,
};

/** A task counts as done when ticked, or automatically when its work shows up in today's history. */
function autoDone(task: PlanTask, state: State, date: string): boolean {
  if (task.sdKey) return !!state.sd[task.sdKey]?.history.some((h) => h.date === date);
  if (!task.slug) return false;
  const e = state.problems[task.slug];
  if (!e) return false;
  const touchedToday = e.history.some((h) => h.date === date);
  if (task.kind === "new") return touchedToday && isSolved(e);
  if (task.kind === "failed") return touchedToday;
  return false;
}

export function useDailyPlan() {
  const state = useStore();
  const hydrated = useHydrated();
  const date = today();
  const tasks = state.plans[date];

  useEffect(() => {
    if (hydrated && !tasks) savePlan(date, buildDailyPlan(state));
  }, [hydrated, tasks, date, state]);

  const list = (tasks ?? []).map((t) => {
    const manual = state.daily[date]?.[t.id];
    const auto = autoDone(t, state, date);
    return { task: t, done: manual ?? auto, auto };
  });
  return { ready: hydrated && !!tasks, date, items: list, done: list.filter((x) => x.done).length };
}

export const taskTrack = (t: PlanTask) => (t.kind === "hld" || t.kind === "lld" ? t.kind : "dsa");

export function DailyPlan({ compact, tracks }: { compact?: boolean; tracks?: ("dsa" | "hld" | "lld")[] }) {
  const plan = useDailyPlan();
  const state = useStore();
  const { ready, date } = plan;
  const items = tracks ? plan.items.filter((x) => tracks.includes(taskTrack(x.task))) : plan.items;
  const done = items.filter((x) => x.done).length;
  // Only label tracks when more than one is shown (e.g. HLD vs LLD in the System Design plan).
  const showTrack = !tracks || tracks.length > 1;
  const catalog = useCatalog();
  const sdItems = useSDItems();

  if (!ready) {
    return (
      <Panel className="space-y-3 p-4" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Shimmer className="size-4" />
            <Shimmer className="h-4 flex-1" />
          </div>
        ))}
      </Panel>
    );
  }

  if (!items.length) {
    if (tracks && plan.items.length) {
      // Today's plan was generated without these tracks (e.g. before System Design was enabled).
      return (
        <EmptyState
          icon={Sparkles}
          title="No tasks for this track today"
          description="Today's plan was created earlier. Regenerate it to include System Design tasks."
          action={
            <Button size="sm" variant="outline" onClick={() => replacePlan(date, buildDailyPlan(state))}>
              Regenerate today&apos;s plan
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        icon={Sparkles}
        title="No study plan for today"
        description="Everything in the curriculum is done. Add your own problems or run a mock interview."
      />
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm">
          <span className="font-mono font-semibold tabular-nums">
            {done}/{items.length}
          </span>{" "}
          <span className="text-muted-foreground">done today</span>
        </p>
        <div className="flex gap-1" aria-hidden>
          {items.map((x) => (
            <span key={x.task.id} className={cn("h-1.5 w-5 rounded-full transition-colors", x.done ? "bg-success" : "bg-muted")} />
          ))}
        </div>
      </div>
      <ul className="divide-y">
        {items.map(({ task, done: isDone, auto }) => {
          const Icon = KIND_ICON[task.kind];
          const item = task.slug ? catalog.find((c) => c.problem.slug === task.slug) : undefined;
          const pattern = task.patternId ? patternIndex.get(task.patternId)?.pattern : undefined;
          const sdItem = task.sdKey ? sdItems.find((x) => x.key === task.sdKey) : undefined;
          const href = sdItem ? sdItem.href : item ? `/problems/${item.problem.slug}` : pattern ? `/patterns/${pattern.id}` : "#";
          const title = sdItem?.title ?? item?.problem.title ?? pattern?.name ?? "—";
          const track = taskTrack(task);
          const difficulty = item?.problem.difficulty ?? sdItem?.difficulty;
          const id = `task-${task.id}`;
          return (
            <li key={task.id} className={cn("flex items-center gap-3 px-4", compact ? "py-2.5" : "py-3")}>
              <Checkbox
                id={id}
                checked={isDone}
                onCheckedChange={(v) => toggleDaily(date, task.id, v === true)}
                aria-label={`Mark "${task.label}: ${title}" ${isDone ? "not done" : "done"}`}
                className="data-checked:animate-pop data-checked:border-success data-checked:bg-success"
              />
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground",
                  isDone && "text-success",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {task.label}
                  {showTrack && <TrackTag track={track} />}
                </span>
                <Link
                  href={href}
                  className={cn(
                    "block truncate text-sm font-medium outline-none hover:text-primary focus-visible:underline",
                    isDone && "text-muted-foreground line-through decoration-muted-foreground/50",
                  )}
                >
                  {task.kind === "theory" ? `Read & re-derive: ${title}` : title}
                </Link>
              </span>
              {difficulty && <DifficultyBadge difficulty={difficulty} className="hidden sm:inline-flex" />}
              <span
                className={cn(
                  "hidden w-16 items-center justify-end gap-1 text-xs sm:flex",
                  isDone ? "text-success" : "text-muted-foreground",
                )}
              >
                {isDone ? (
                  <>
                    <Check className="size-3.5" aria-hidden /> {auto ? "Auto" : "Done"}
                  </>
                ) : (
                  "Pending"
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

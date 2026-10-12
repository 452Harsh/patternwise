import { allPatterns, getTopic, patternIndex } from "@/data/curriculum";
import { SD_ITEMS, type SDItem } from "@/data/sd";
import { IMPORTANT } from "@/data/important";
import { PHASES } from "@/data/study-plan";
import { isDue, isSDDue, isSolved, needsRevisit, today, type PlanTask, type State } from "./progress";
import { currentPhaseIndex, patternStat } from "./stats";

/**
 * Today's focused plan: N new problems from the current phase, one pattern to revise,
 * one previously failed / shaky problem, and a short theory block.
 */
export function buildDailyPlan(state: State): PlanTask[] {
  const progress = state.problems;
  const tasks: PlanTask[] = [];

  // New problems: walk the current phase (then later phases) in study order.
  const phaseIdx = currentPhaseIndex(state);
  const topicIds = PHASES.slice(phaseIdx).flatMap((p) => p.topicIds);
  const order = topicIds.length ? topicIds : PHASES.flatMap((p) => p.topicIds);
  const pool = order.flatMap((id) => getTopic(id)?.patterns.flatMap((p) => p.problems) ?? []);
  const fresh = pool.filter((p) => (progress[p.slug]?.status ?? "todo") === "todo");
  // In the revision phase, prefer unsolved essentials.
  const essentials = IMPORTANT.filter((s) => !isSolved(progress[s]));
  const picks = phaseIdx === PHASES.length - 1 && essentials.length ? essentials : fresh.map((p) => p.slug);
  for (const slug of picks.slice(0, state.settings.dailyNew)) {
    tasks.push({ id: `new-${slug}`, kind: "new", label: "New problem", slug });
  }

  // Pattern revision: the weakest rated pattern, else one you're learning.
  const stats = allPatterns.map((x) => ({ ...x, stat: patternStat(x.pattern, progress, state.patterns) }));
  const weak = stats.filter((x) => x.stat.weak).sort((a, b) => (a.stat.avg || 99) - (b.stat.avg || 99))[0];
  const learning = stats.find((x) => state.patterns[x.pattern.id]?.status === "learning");
  const touched = stats.find((x) => x.stat.solved > 0);
  const patternPick = weak ?? learning ?? touched;
  if (patternPick) {
    tasks.push({ id: `pattern-${patternPick.pattern.id}`, kind: "pattern", label: "Pattern revision", patternId: patternPick.pattern.id });
  }

  // A previously failed or shaky problem, else something due.
  const entries = Object.entries(progress);
  const failed =
    entries.filter(([, e]) => e.failCount > 0 && e.status !== "mastered").sort((a, b) => (a[1].lastAttemptAt ?? "").localeCompare(b[1].lastAttemptAt ?? ""))[0] ??
    entries.find(([, e]) => needsRevisit(e)) ??
    entries.find(([, e]) => isDue(e));
  if (failed) tasks.push({ id: `failed-${failed[0]}`, kind: "failed", label: "Retry a problem", slug: failed[0] });

  // Theory: the pattern behind today's first new problem.
  const firstNew = tasks.find((t) => t.kind === "new")?.slug;
  const theoryPattern = firstNew
    ? allPatterns.find((x) => x.pattern.problems.some((p) => p.slug === firstNew))?.pattern.id
    : patternPick?.pattern.id;
  if (theoryPattern && patternIndex.has(theoryPattern)) {
    tasks.push({ id: `theory-${theoryPattern}`, kind: "theory", label: "20 min theory", patternId: theoryPattern });
  }

  // Both modules share one daily plan document; each module's page shows only its own tasks.
  tasks.push(...systemDesignTasks(state));
  return tasks;
}

/**
 * System Design part of the plan: one HLD concept (or an overdue HLD review), one LLD pattern/concept,
 * and one design problem, alternating HLD and LLD by day.
 */
function systemDesignTasks(state: State): PlanTask[] {
  const out: PlanTask[] = [];
  const t = today();
  const e = (x: SDItem) => state.sd[x.key];
  const untouched = (x: SDItem) => !e(x)?.history.length;
  const due = (x: SDItem) => isSDDue(e(x));
  const oldestDue = (xs: SDItem[]) => xs.filter(due).sort((a, b) => e(a)!.nextReview!.localeCompare(e(b)!.nextReview!))[0];
  const task = (x: SDItem, label: string): PlanTask => ({ id: `sd-${x.key}`, kind: x.track, label, sdKey: x.key });

  const hldConcepts = SD_ITEMS.filter((x) => x.track === "hld" && x.kind === "concept");
  const hldDue = oldestDue(SD_ITEMS.filter((x) => x.track === "hld" && x.kind !== "problem"));
  const hldNext = hldConcepts.find(untouched);
  if (hldDue) out.push(task(hldDue, "Revise"));
  else if (hldNext) out.push(task(hldNext, "Learn"));

  const lldItems = SD_ITEMS.filter((x) => x.track === "lld" && (x.kind === "pattern" || x.kind === "concept"));
  const lldDue = oldestDue(lldItems);
  const lldNext = lldItems.find((x) => x.kind === "pattern" && untouched(x)) ?? lldItems.find(untouched);
  if (lldDue) out.push(task(lldDue, "Review"));
  else if (lldNext) out.push(task(lldNext, "Learn"));

  const track = new Date(`${t}T12:00:00`).getDate() % 2 === 0 ? "hld" : "lld";
  const problems = SD_ITEMS.filter((x) => x.kind === "problem" && x.track === track);
  const problem = oldestDue(problems) ?? problems.find(untouched);
  if (problem) out.push(task(problem, "Practice"));
  return out;
}

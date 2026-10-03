import { allPatterns, allProblems, getTopic, topics } from "@/data/curriculum";
import { COVERAGE } from "@/data/coverage";
import { IMPORTANT } from "@/data/important";
import { PHASES } from "@/data/study-plan";
import type { Pattern, Problem, Topic } from "@/data/types";
import {
  addDays,
  isDue,
  isSolved,
  today,
  type Entry,
  type PatternEntry,
  type ProgressMap,
  type State,
} from "./progress";

/* ---------- per-problem score ---------- */

/**
 * 0–1 mastery score for one problem:
 * not started 0 · attempted 0.2 · solved 0.4–1.0 scaled by confidence · mastered 1.
 */
export function problemScore(e: Entry | undefined): number {
  if (!e || e.status === "todo") return 0;
  if (e.status === "mastered") return 1;
  if (e.status === "attempted") return 0.2;
  return 0.4 + 0.12 * (e.understanding || 0);
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function masteryOf(problems: Problem[], progress: ProgressMap): number {
  return mean(problems.map((p) => problemScore(progress[p.slug])));
}

export function countSolved(problems: Problem[], progress: ProgressMap) {
  let solved = 0;
  let mastered = 0;
  for (const p of problems) {
    const e = progress[p.slug];
    if (isSolved(e)) solved++;
    if (e?.status === "mastered") mastered++;
  }
  return { solved, mastered, total: problems.length };
}

export function difficultySplit(problems: Problem[], progress?: ProgressMap) {
  const out = { Easy: 0, Medium: 0, Hard: 0 };
  for (const p of problems) if (!progress || isSolved(progress[p.slug])) out[p.difficulty]++;
  return out;
}

/* ---------- patterns & topics ---------- */

export const WEAK_BELOW = 3;
export const MASTERED_AT = 0.8;
export const TOPIC_DONE_AT = 0.8;

export interface PatternStat {
  solved: number;
  total: number;
  rated: number;
  avg: number;
  flagged: number;
  mastery: number;
  weak: boolean;
  reason?: string;
}

export function patternStat(
  pattern: Pattern,
  progress: ProgressMap,
  patterns: Record<string, PatternEntry>,
): PatternStat {
  const { solved, total } = countSolved(pattern.problems, progress);
  const ratings = pattern.problems.map((p) => progress[p.slug]?.understanding ?? 0).filter((u) => u > 0);
  const avg = mean(ratings);
  const flagged = pattern.problems.filter((p) => progress[p.slug]?.revisit || (progress[p.slug]?.failCount ?? 0) > 0).length;
  const status = patterns[pattern.id]?.status;

  let reason: string | undefined;
  if (status === "needs-practice") reason = "Marked as needs practice";
  else if (ratings.length && avg < WEAK_BELOW) reason = `Confidence ${avg.toFixed(1)}/5`;
  else if (flagged > 0) reason = `${flagged} problem${flagged > 1 ? "s" : ""} to revisit`;

  return {
    solved,
    total,
    rated: ratings.length,
    avg,
    flagged,
    mastery: masteryOf(pattern.problems, progress),
    weak: !!reason,
    reason,
  };
}

export function topicStat(topic: Topic, progress: ProgressMap) {
  const problems = topic.patterns.flatMap((p) => p.problems);
  const { solved, mastered, total } = countSolved(problems, progress);
  const ratings = problems.map((p) => progress[p.slug]?.understanding ?? 0).filter((u) => u > 0);
  const avg = mean(ratings);
  const mastery = masteryOf(problems, progress);
  return {
    solved,
    mastered,
    total,
    rated: ratings.length,
    avg,
    mastery,
    completed: total > 0 && solved / total >= TOPIC_DONE_AT,
    started: solved > 0 || ratings.length > 0,
    weak: ratings.length >= 2 && avg < WEAK_BELOW,
  };
}

/* ---------- activity & streaks ---------- */

export type Scope = "dsa" | "sd";

/** Days with activity: DSA attempts + DSA mock interviews, or System Design reviews/practice/sessions. */
export function activityByDay(state: State, scope: Scope = "dsa"): Map<string, number> {
  const counts = new Map<string, number>();
  const bump = (d: string) => counts.set(d, (counts.get(d) ?? 0) + 1);
  if (scope === "dsa") {
    for (const e of Object.values(state.problems)) for (const h of e.history) bump(h.date);
    for (const m of state.mocks) bump(m.date);
  } else {
    for (const e of Object.values(state.sd)) for (const h of e.history) bump(h.date);
  }
  return counts;
}

export function streaks(state: State, scope: Scope = "dsa") {
  const days = activityByDay(state, scope);
  const t = today();
  let current = 0;
  // A streak survives until the end of today even if today has no activity yet.
  let d = days.has(t) ? t : addDays(t, -1);
  while (days.has(d)) {
    current++;
    d = addDays(d, -1);
  }
  const sorted = [...days.keys()].sort();
  let longest = 0;
  let run = 0;
  let prev = "";
  for (const day of sorted) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }
  return { current, longest, activeToday: days.has(t) };
}

/** First successful solves per day (for the "solved over time" chart). */
export function firstSolvesByDay(state: State): Map<string, number> {
  const out = new Map<string, number>();
  for (const e of Object.values(state.problems)) {
    const first = e.history.find((h) => h.kind === "solve" && h.result !== "failed");
    const date = first?.date ?? (isSolved(e) && e.solvedAt ? e.solvedAt.slice(0, 10) : undefined);
    if (date) out.set(date, (out.get(date) ?? 0) + 1);
  }
  return out;
}

export function solvedSince(state: State, days: number): number {
  const from = addDays(today(), -days + 1);
  let n = 0;
  for (const [d, c] of firstSolvesByDay(state)) if (d >= from) n += c;
  return n;
}

/* ---------- headline metrics ---------- */

export function overview(state: State) {
  const progress = state.problems;
  const everything = allProblems.map((x) => x.problem);
  const solved = countSolved(everything, progress);

  const patternStats = allPatterns.map((x) => ({ ...x, stat: patternStat(x.pattern, progress, state.patterns) }));
  const patternsMastered = patternStats.filter((x) => x.stat.mastery >= MASTERED_AT).length;
  const topicStats = topics.map((t) => ({ topic: t, stat: topicStat(t, progress) }));
  const topicsCompleted = topicStats.filter((x) => x.stat.completed).length;

  const solvedEntries = Object.values(progress).filter(isSolved);
  const revised = solvedEntries.filter((e) => e.revisitCount > 0).length;
  const due = Object.values(progress).filter(isDue).length;

  const essentials = countSolved(
    IMPORTANT.map((s) => allProblems.find((x) => x.problem.slug === s)!.problem),
    progress,
  );
  const mocks = Math.min(1, state.mocks.length / Math.max(1, state.settings.mockTarget));

  // Preparation progress: five equal segments.
  const segments = [
    { key: "topics", label: "Topics", value: topicsCompleted / topics.length, detail: `${topicsCompleted}/${topics.length} completed` },
    { key: "patterns", label: "Patterns", value: patternsMastered / allPatterns.length, detail: `${patternsMastered}/${allPatterns.length} mastered` },
    { key: "problems", label: "Problems", value: solved.solved / solved.total, detail: `${solved.solved}/${solved.total} solved` },
    {
      key: "revision",
      label: "Revision",
      value: revised / solved.total,
      detail: `${revised}/${solved.total} revised at least once`,
    },
    {
      key: "mocks",
      label: "Mock interviews",
      value: mocks,
      detail: `${state.mocks.length}/${state.settings.mockTarget} done`,
    },
  ];
  const preparation = mean(segments.map((s) => s.value));

  // Interview readiness: essentials, core-pattern mastery, revision health, mocks.
  const corePatterns = COVERAGE.filter((c) => c.tier === "core").flatMap((c) => c.patterns);
  const coreMastery = mean(
    patternStats.filter((x) => corePatterns.includes(x.pattern.id)).map((x) => x.stat.mastery),
  );
  // Essentials revised at least once and not currently overdue, out of all essentials.
  const revisionHealth =
    IMPORTANT.filter((slug) => {
      const e = progress[slug];
      return isSolved(e) && e!.revisitCount > 0 && !isDue(e);
    }).length / IMPORTANT.length;
  const readiness =
    0.35 * (essentials.solved / essentials.total) + 0.35 * coreMastery + 0.15 * revisionHealth + 0.15 * mocks;

  return {
    solved,
    patternsMastered,
    topicsCompleted,
    due,
    essentials,
    segments,
    preparation,
    readiness,
    readinessParts: { essentials: essentials.solved / essentials.total, coreMastery, revisionHealth, mocks },
    patternStats,
    topicStats,
  };
}

/* ---------- study plan ---------- */

export function phaseProgress(state: State) {
  return PHASES.map((phase) => {
    if (!phase.topicIds.length) {
      const essentials = countSolved(
        IMPORTANT.map((s) => allProblems.find((x) => x.problem.slug === s)!.problem),
        state.problems,
      );
      const masteredEssentials = IMPORTANT.filter((s) => state.problems[s]?.status === "mastered").length;
      const mocks = Math.min(1, state.mocks.length / Math.max(1, state.settings.mockTarget));
      const value = (essentials.solved / essentials.total + masteredEssentials / IMPORTANT.length + mocks) / 3;
      return { phase, topics: [] as Topic[], solved: essentials.solved, total: essentials.total, value };
    }
    const ts = phase.topicIds.map((id) => getTopic(id)!).filter(Boolean);
    const problems = ts.flatMap((t) => t.patterns.flatMap((p) => p.problems));
    const { solved, total } = countSolved(problems, state.problems);
    return { phase, topics: ts, solved, total, value: total ? solved / total : 0 };
  });
}

/** The first phase that isn't ~complete. */
export function currentPhaseIndex(state: State): number {
  const prog = phaseProgress(state);
  const i = prog.findIndex((p) => p.value < 0.8);
  return i === -1 ? PHASES.length - 1 : i;
}

import { allPatterns } from "@/data/curriculum";
import { COVERAGE } from "@/data/coverage";
import { IMPORTANT } from "@/data/important";
import { PHASES } from "@/data/study-plan";
import type { Difficulty, Pattern, Topic } from "@/data/types";
import { daysBetween } from "@/lib/day";
import type { Entry, HistoryItem, State } from "@/lib/progress";
import {
  levelOf,
  type CoachPrefs,
  type DSAAction,
  type DSAAttempt,
  type DSARecommendation,
  type PatternFacts,
  type RecProblem,
  type Signal,
} from "./types";

/**
 * Deterministic DSA recommendation engine. Everything the coach says about the user's DSA
 * preparation is computed here from real progress data; the language model only explains it.
 */

const RECENT_DAYS = 21;
const LEVELS: Difficulty[] = ["Easy", "Medium", "Hard"];
const ESSENTIAL = new Set(IMPORTANT);

const TIER = new Map<string, "core" | "common" | "advanced">();
for (const c of COVERAGE) for (const id of c.patterns) if (!TIER.has(id) || c.tier === "core") TIER.set(id, c.tier);

/** Study order: earlier phases first, then the order patterns appear in the curriculum. */
const PHASE_ORDER = new Map<string, number>();
PHASES.forEach((p, i) => p.topicIds.forEach((t) => PHASE_ORDER.set(t, i)));

const isSolved = (e?: Entry) => e?.status === "solved" || e?.status === "mastered";
const isDueOn = (e: Entry | undefined, date: string) => !!e?.nextReview && e.status !== "todo" && e.nextReview <= date;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const pctText = (v: number) => `${Math.round(v * 100)}%`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const scoreOf = (a: DSAAttempt) => (a.result === "failed" ? 0 : a.result === "hints" ? 0.5 : 1);

/** Outcome of one attempt: solved/reviewed 1, with hints 0.5, failed 0. Old entries without a result use confidence. */
function outcome(h: HistoryItem): number {
  if (h.result === "failed") return 0;
  if (h.result === "hints") return 0.5;
  if (h.result) return 1;
  return h.confidence >= 3 ? 1 : 0.5;
}

interface PoolProblem {
  slug: string;
  title: string;
  difficulty: Difficulty;
  takeaway: string;
}

/** Curated problems of a pattern plus the user's own problems filed under it. */
function poolOf(pattern: Pattern, state: State): PoolProblem[] {
  const custom = state.custom
    .filter((c) => c.patternId === pattern.id)
    .map((c) => ({ slug: c.slug, title: c.title, difficulty: c.difficulty, takeaway: c.takeaway || "Your own problem" }));
  return [...pattern.problems, ...custom];
}

export function patternFacts(pattern: Pattern, topic: Topic, state: State, date: string): PatternFacts {
  const pool = poolOf(pattern, state);
  const attempts: (DSAAttempt & { at: string; outcome: number })[] = [];
  const byDifficulty = Object.fromEntries(
    LEVELS.map((l) => [l, { solved: 0, total: 0, recent: 0, recentSuccess: null as number | null }]),
  ) as PatternFacts["byDifficulty"];
  const recentByLevel: Record<Difficulty, number[]> = { Easy: [], Medium: [], Hard: [] };
  let touched = 0;
  let solved = 0;
  let mastered = 0;
  let due = 0;
  let maxOverdueDays = 0;
  const confidences: number[] = [];
  const mistakes: PatternFacts["mistakes"] = [];

  for (const p of pool) {
    const e = state.problems[p.slug];
    byDifficulty[p.difficulty].total++;
    if (!e) continue;
    if (e.history.length || e.status !== "todo") touched++;
    if (isSolved(e)) {
      solved++;
      byDifficulty[p.difficulty].solved++;
    }
    if (e.status === "mastered") mastered++;
    if (e.understanding > 0) confidences.push(e.understanding);
    if (isDueOn(e, date)) {
      due++;
      maxOverdueDays = Math.max(maxOverdueDays, daysBetween(e.nextReview!, date));
    }
    if (e.mistakes?.trim()) mistakes.push({ title: p.title, text: e.mistakes.trim().slice(0, 240) });
    for (const h of e.history) {
      attempts.push({
        slug: p.slug,
        title: p.title,
        difficulty: p.difficulty,
        date: h.date,
        at: h.at ?? `${h.date}T12:00:00.000Z`,
        result: h.result ?? (h.confidence >= 3 ? "solved" : "hints"),
        confidence: h.confidence,
        outcome: outcome(h),
      });
    }
  }

  attempts.sort((a, b) => a.at.localeCompare(b.at));
  const recent = attempts.filter((a) => daysBetween(a.date, date) <= RECENT_DAYS);
  for (const a of recent) recentByLevel[a.difficulty].push(a.outcome);
  for (const l of LEVELS) {
    byDifficulty[l].recent = recentByLevel[l].length;
    byDifficulty[l].recentSuccess = mean(recentByLevel[l]);
  }
  const struggled = recent.filter((a) => a.outcome < 1);
  const lastPracticed = attempts.at(-1)?.date ?? null;

  return {
    patternId: pattern.id,
    patternName: pattern.name,
    topicId: topic.id,
    topicName: topic.name,
    tier: TIER.get(pattern.id) ?? null,
    essentials: pattern.problems.filter((p) => ESSENTIAL.has(p.slug)).length,
    total: pool.length,
    touched,
    solved,
    mastered,
    attempts: attempts.length,
    recentAttempts: recent.length,
    recentSuccess: mean(recent.map((a) => a.outcome)),
    overallSuccess: mean(attempts.map((a) => a.outcome)),
    recentFails: recent.filter((a) => a.result === "failed").length,
    recentHints: recent.filter((a) => a.result === "hints").length,
    recentStruggledProblems: new Set(struggled.map((a) => a.slug)).size,
    avgConfidence: mean(confidences),
    due,
    maxOverdueDays,
    lastPracticed,
    daysSince: lastPracticed ? daysBetween(lastPracticed, date) : null,
    selfRating: state.patterns[pattern.id]?.status ?? "unrated",
    variationsCovered: solved,
    variationsTotal: pool.length,
    byDifficulty,
    mistakes: mistakes.slice(0, 4),
    lastAttempts: attempts.slice(-6).reverse().map(({ at: _at, outcome: _o, ...a }) => (void _at, void _o, a)),
  };
}

/** Repeated struggle on the same pattern: three or more shaky attempts across two or more problems, mostly unsuccessful. */
function isStuck(f: PatternFacts): boolean {
  const shaky = f.recentFails + f.recentHints;
  const lastThree = f.lastAttempts.slice(0, 3);
  const lastThreeBad = lastThree.length >= 2 && lastThree.filter((a) => a.result === "failed" || a.result === "hints").length >= 2;
  return shaky >= 3 && f.recentStruggledProblems >= 2 && (f.recentSuccess ?? 1) < 0.5 && lastThreeBad;
}

function signalsFor(f: PatternFacts): Signal[] {
  const sig = (key: Signal["key"], label: string, weight: number, value: number, detail: string): Signal => {
    const v = clamp(value);
    return { key, label, weight, value: v, points: Math.round(weight * v), detail };
  };

  const revision = f.due ? clamp(0.6 + 0.2 * (f.due - 1) + 0.02 * f.maxOverdueDays) : 0;

  const lowSuccess = f.recentSuccess === null ? 0 : 1 - f.recentSuccess;
  // How the last two attempts went, if they were in the last two weeks: active struggle weighs most.
  const lastTwo = f.lastPracticed ? f.lastAttempts.slice(0, 2).filter((a) => daysBetween(a.date, f.lastPracticed!) <= 14) : [];
  const recentForm = lastTwo.length && (f.daysSince ?? 99) <= 14 ? 1 - mean(lastTwo.map(scoreOf))! : 0;
  const lowConfidence = f.avgConfidence === null ? 0 : clamp((3.5 - f.avgConfidence) / 2.5);
  const struggle = clamp((f.recentFails + 0.5 * f.recentHints) / 4);
  const selfFlag = f.selfRating === "needs-practice" ? 1 : 0;
  const weakness = clamp(0.55 * Math.max(lowSuccess, recentForm) + 0.25 * lowConfidence + 0.1 * struggle + 0.1 * selfFlag);
  const weakParts: string[] = [];
  if (f.recentSuccess !== null) weakParts.push(`${pctText(f.recentSuccess)} success in the last ${RECENT_DAYS} days`);
  if (f.recentFails) weakParts.push(plural(f.recentFails, "failed attempt"));
  if (f.recentHints) weakParts.push(`${plural(f.recentHints, "attempt")} needed hints`);
  if (f.avgConfidence !== null) weakParts.push(`average confidence ${f.avgConfidence.toFixed(1)}/5`);
  if (selfFlag) weakParts.push("you marked it “needs practice”");

  const recency = f.daysSince === null ? 0 : clamp((f.daysSince - 3) / 18);
  const importance = f.tier === "core" ? 1 : f.tier === "common" ? 0.6 : 0.3;
  const coverage = f.solved ? clamp(1 - f.variationsCovered / Math.max(1, f.variationsTotal)) : 0;

  // Trend: the last two attempts against everything before them.
  const outcomes = f.lastAttempts.map(scoreOf);
  const latest = mean(outcomes.slice(0, 2));
  const before = mean(outcomes.slice(2));
  const trend = latest !== null && before !== null ? clamp(before - latest) : 0;

  return [
    sig("revision", "Due for revision", 20, revision, f.due ? `${plural(f.due, "problem")} due${f.maxOverdueDays ? `, up to ${f.maxOverdueDays} days overdue` : ""}` : "Nothing due"),
    sig("weakness", "Weakness", 35, weakness, weakParts.join(" · ") || "No struggle recorded"),
    sig("recency", "Time since practice", 10, recency, f.daysSince === null ? "Never practised" : `Last practised ${f.daysSince === 0 ? "today" : `${plural(f.daysSince, "day")} ago`}`),
    sig("importance", "Interview importance", 10, importance, f.tier ? `${f.tier[0].toUpperCase()}${f.tier.slice(1)} interview area${f.essentials ? ` · ${plural(f.essentials, "essential problem")}` : ""}` : "Not in the core interview map"),
    sig("coverage", "Variation coverage", 10, coverage, `${f.variationsCovered} of ${f.variationsTotal} variations solved`),
    sig("trend", "Recent performance", 15, trend, trend ? "Your last two attempts went worse than the ones before" : "Stable or improving"),
  ];
}

function difficultyPlan(f: PatternFacts, stuck: boolean, prefs: CoachPrefs): DSARecommendation["difficulty"] {
  if (prefs.difficulty !== "auto") return { target: prefs.difficulty, move: "stay", why: `${prefs.difficulty} is set in your coach preferences.` };
  if (stuck) return { target: "Easy", move: "fundamentals", why: "Recent attempts kept failing on the same idea, so go back to the simplest form." };
  const attempted = LEVELS.filter((l) => f.byDifficulty[l].recent > 0);
  if (!attempted.length) {
    const solvedLevels = LEVELS.filter((l) => f.byDifficulty[l].solved > 0);
    const top = solvedLevels.at(-1);
    if (!top) return { target: "Easy", move: "stay", why: "Start with the simplest version of the pattern." };
    return { target: top, move: "stay", why: `You have solved ${top} problems here before; refresh at that level.` };
  }
  const current = attempted.at(-1)!;
  const { recent, recentSuccess } = f.byDifficulty[current];
  const i = LEVELS.indexOf(current);
  if (recent >= 2 && (recentSuccess ?? 0) >= 0.8 && i < 2) {
    return { target: LEVELS[i + 1], move: "harder", why: `${pctText(recentSuccess!)} success on ${recent} recent ${current} attempts.` };
  }
  if (recent >= 2 && (recentSuccess ?? 1) < 0.4 && i > 0) {
    return { target: LEVELS[i - 1], move: "easier", why: `Only ${pctText(recentSuccess!)} success on ${recent} recent ${current} attempts.` };
  }
  return { target: current, move: "stay", why: `Keep working at ${current} until it's consistently clean.` };
}

function pickProblems(pattern: Pattern, state: State, date: string, action: DSAAction, target: Difficulty, count: number): RecProblem[] {
  const pool = poolOf(pattern, state);
  const out: RecProblem[] = [];
  const used = new Set<string>();
  const add = (p: PoolProblem, role: RecProblem["role"], why: string) => {
    if (used.has(p.slug) || out.length >= count) return;
    used.add(p.slug);
    out.push({ slug: p.slug, title: p.title, difficulty: p.difficulty, href: `/problems/${p.slug}`, role, why, teaches: p.takeaway });
  };
  const e = (p: PoolProblem) => state.problems[p.slug];
  const unsolved = pool.filter((p) => !isSolved(e(p)) && !(e(p)?.failCount));
  const byDistance = (xs: PoolProblem[]) =>
    [...xs].sort((a, b) => Math.abs(LEVELS.indexOf(a.difficulty) - LEVELS.indexOf(target)) - Math.abs(LEVELS.indexOf(b.difficulty) - LEVELS.indexOf(target)));
  const due = pool
    .filter((p) => isDueOn(e(p), date))
    .sort((a, b) => (e(a)!.nextReview ?? "").localeCompare(e(b)!.nextReview ?? ""));
  const failed = pool
    .filter((p) => (e(p)?.failCount ?? 0) > 0 && !isSolved(e(p)))
    .sort((a, b) => (e(a)!.lastAttemptAt ?? "").localeCompare(e(b)!.lastAttemptAt ?? ""));

  switch (action) {
    case "review-concept": {
      const easiest = [...unsolved].sort((a, b) => LEVELS.indexOf(a.difficulty) - LEVELS.indexOf(b.difficulty))[0];
      if (easiest) add(easiest, "guided", "One guided problem after the review, using hints if needed.");
      else if (failed[0]) add(failed[0], "guided", "Retry it slowly with hints after the review.");
      break;
    }
    case "revise":
      due.forEach((p) => add(p, "due", `Due for review${e(p)!.nextReview! < date ? ` since ${e(p)!.nextReview}` : " today"}.`));
      byDistance(unsolved).forEach((p) => add(p, "new", `A fresh ${p.difficulty} problem to check the pattern still transfers.`));
      break;
    case "strengthen":
      failed.forEach((p) => add(p, "retry", "You couldn't solve this one before; retry it."));
      due.forEach((p) => add(p, "due", "Due for review."));
      byDistance(unsolved).forEach((p) => add(p, "new", `${p.difficulty} practice at your current level.`));
      break;
    case "broaden":
      byDistance(unsolved).forEach((p) => add(p, "variation", "A variation of this pattern you haven't solved yet."));
      break;
    case "advance":
      unsolved
        .filter((p) => LEVELS.indexOf(p.difficulty) >= LEVELS.indexOf(target))
        .forEach((p) => add(p, "harder", `A ${p.difficulty} variation; you're ready for it.`));
      byDistance(unsolved).forEach((p) => add(p, "variation", "A variation you haven't solved yet."));
      break;
    case "learn":
      [...unsolved]
        .sort((a, b) => LEVELS.indexOf(a.difficulty) - LEVELS.indexOf(b.difficulty))
        .forEach((p) => add(p, "new", p === unsolved[0] ? "The first problem in the curated order." : "Builds on the first one."));
      break;
  }
  return out;
}

function chooseAction(f: PatternFacts, signals: Signal[], stuck: boolean): DSAAction {
  const v = (k: Signal["key"]) => signals.find((s) => s.key === k)!.value;
  if (stuck) return "review-concept";
  if (v("weakness") >= 0.4) return "strengthen";
  if (f.due > 0) return "revise";
  if ((f.recentSuccess ?? f.overallSuccess ?? 0) >= 0.8 && (f.avgConfidence ?? 0) >= 4 && f.solved >= 3) {
    return v("coverage") >= 0.4 ? "broaden" : "advance";
  }
  if (v("coverage") >= 0.5) return "broaden";
  return "revise";
}

function reasonsFor(f: PatternFacts, action: DSAAction): string[] {
  const out: string[] = [];
  if (f.attempts) {
    out.push(`You have solved ${plural(f.solved, "problem")} of ${f.total} in ${f.patternName}${f.attempts > f.solved ? ` (${plural(f.attempts, "attempt")} logged)` : ""}.`);
  }
  const struggles = f.lastAttempts.filter((a) => a.result === "failed" || a.result === "hints");
  if (struggles.length) {
    const names = [...new Set(struggles.map((a) => `${a.title} (${a.difficulty})`))].slice(0, 3).join(", ");
    out.push(`You struggled recently on ${names}.`);
  }
  if (f.due) out.push(`${plural(f.due, "problem")} in this pattern ${f.due === 1 ? "is" : "are"} due for review.`);
  if (f.daysSince !== null && f.daysSince >= 7) out.push(`It hasn't been practised for ${f.daysSince} days.`);
  if (f.selfRating === "needs-practice") out.push("You marked this pattern as “needs practice”.");
  if (action === "broaden" || action === "advance") out.push(`You've covered ${f.variationsCovered} of ${f.variationsTotal} variations; each curated problem teaches a different one.`);
  if (f.tier === "core") out.push("It's a core interview area.");
  return out;
}

export interface DSAAnalysis {
  date: string;
  ranked: DSARecommendation[];
  learn: DSARecommendation[];
  focus: DSARecommendation | null;
  secondary: DSARecommendation | null;
  avoid: string[];
  strong: PatternFacts[];
  profile: {
    problemsSolved: number;
    attemptsLast7: number;
    activeDaysLast14: number;
    daysSinceLastPractice: number | null;
    dueTotal: number;
    patternsStarted: number;
    patternsTotal: number;
    corePatternsUntouched: number;
  };
}

/** Analyse all DSA progress for `date` (the user's local day). */
export function analyzeDSA(state: State, date: string, prefs: CoachPrefs, interviewDaysLeft: number | null): DSAAnalysis {
  const facts = allPatterns.map(({ pattern, topic }) => ({ pattern, topic, f: patternFacts(pattern, topic, state, date) }));
  const started = facts.filter((x) => x.f.attempts > 0 || x.f.solved > 0);

  const ranked: DSARecommendation[] = started
    .map(({ pattern, f }) => {
      const signals = signalsFor(f);
      const stuck = isStuck(f);
      const action = chooseAction(f, signals, stuck);
      const priority = Math.min(100, signals.reduce((a, s) => a + s.points, 0) + (stuck ? 10 : 0));
      const difficulty = difficultyPlan(f, stuck, prefs);
      const problems = pickProblems(pattern, state, date, action, difficulty.target, action === "review-concept" ? 1 : Math.max(2, prefs.dailyProblems + 1));
      return {
        module: "dsa" as const,
        patternId: pattern.id,
        patternName: pattern.name,
        topicName: f.topicName,
        action,
        priority,
        level: levelOf(priority),
        signals,
        reasons: reasonsFor(f, action),
        difficulty,
        problems,
        stopSolving: stuck,
        facts: f,
      };
    })
    .sort((a, b) => b.priority - a.priority);

  // New material: untouched patterns in study order, core areas first within the current phase.
  const learn: DSARecommendation[] = facts
    .filter((x) => x.f.attempts === 0 && x.f.solved === 0)
    .sort((a, b) => {
      const pa = PHASE_ORDER.get(a.topic.id) ?? 99;
      const pb = PHASE_ORDER.get(b.topic.id) ?? 99;
      if (pa !== pb) return pa - pb;
      return (a.f.tier === "core" ? 0 : 1) - (b.f.tier === "core" ? 0 : 1);
    })
    .slice(0, 3)
    .map(({ pattern, f }) => {
      const importance = f.tier === "core" ? 1 : f.tier === "common" ? 0.6 : 0.3;
      const signals: Signal[] = [
        { key: "importance", label: "Interview importance", weight: 10, value: importance, points: Math.round(10 * importance), detail: f.tier ? `${f.tier} interview area` : "Not in the core interview map" },
        { key: "coverage", label: "Variation coverage", weight: 10, value: 1, points: 10, detail: `0 of ${f.total} variations solved` },
      ];
      const priority = signals.reduce((a, s) => a + s.points, 0);
      return {
        module: "dsa" as const,
        patternId: pattern.id,
        patternName: pattern.name,
        topicName: f.topicName,
        action: "learn" as const,
        priority,
        level: levelOf(priority),
        signals,
        reasons: [`You haven't started ${pattern.name} yet; it's next in your study order (${f.topicName}).`, ...(f.tier === "core" ? ["It's a core interview area."] : [])],
        difficulty: { target: "Easy" as const, move: "stay" as const, why: "Start with the simplest version of the pattern." },
        problems: pickProblems(pattern, state, date, "learn", "Easy", Math.max(2, prefs.dailyProblems)),
        stopSolving: false,
        facts: f,
      };
    });

  const dueTotal = Object.values(state.problems).filter((e) => isDueOn(e, date)).length;
  const interviewSoon = interviewDaysLeft !== null && interviewDaysLeft <= 14;
  const top = ranked[0];
  let focus: DSARecommendation | null = null;
  if (top && (top.priority >= 35 || top.stopSolving || dueTotal > 0 || interviewSoon || !learn.length)) focus = top;
  else focus = learn[0] ?? top ?? null;

  const secondary =
    ranked.find((r) => r !== focus && (r.facts.due > 0 || (r.facts.daysSince ?? 0) >= 7)) ?? ranked.find((r) => r !== focus) ?? null;

  const strong = started
    .map((x) => x.f)
    .filter((f) => f.solved >= 3 && (f.recentSuccess ?? f.overallSuccess ?? 0) >= 0.85 && (f.avgConfidence ?? 0) >= 4)
    .sort((a, b) => (b.avgConfidence ?? 0) - (a.avgConfidence ?? 0));

  const avoid: string[] = [];
  if (focus?.stopSolving) avoid.push(`Don't start more ${focus.patternName} problems today beyond the one guided problem; the same idea keeps tripping you up.`);
  if (focus && (focus.difficulty.move === "easier" || focus.difficulty.move === "fundamentals")) {
    avoid.push(`Skip Hard ${focus.patternName} problems for now. ${focus.difficulty.why}`);
  }
  if (dueTotal >= 5) avoid.push(`Hold off on brand-new topics: ${dueTotal} reviews are due.`);
  if (interviewSoon) avoid.push(`Your interview is in ${plural(interviewDaysLeft!, "day")}: prefer revision over starting advanced new topics.`);
  for (const f of strong.filter((f) => f.recentAttempts >= 3).slice(0, 2)) {
    avoid.push(`No need for more ${f.patternName} reps: your recent attempts there were clean (avg confidence ${f.avgConfidence!.toFixed(1)}/5).`);
  }

  const allEntries = Object.values(state.problems);
  const allDates = allEntries.flatMap((e) => e.history.map((h) => h.date)).sort();
  const last = allDates.at(-1) ?? null;
  return {
    date,
    ranked,
    learn,
    focus,
    secondary,
    avoid,
    strong: strong.slice(0, 5),
    profile: {
      problemsSolved: allEntries.filter(isSolved).length,
      attemptsLast7: allDates.filter((d) => daysBetween(d, date) < 7).length,
      activeDaysLast14: new Set(allDates.filter((d) => daysBetween(d, date) < 14)).size,
      daysSinceLastPractice: last ? daysBetween(last, date) : null,
      dueTotal,
      patternsStarted: started.length,
      patternsTotal: facts.length,
      corePatternsUntouched: facts.filter((x) => x.f.tier === "core" && x.f.attempts === 0 && x.f.solved === 0).length,
    },
  };
}

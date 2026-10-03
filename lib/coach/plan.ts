import { daysBetween } from "@/lib/day";
import type { State } from "@/lib/progress";
import { analyzeDSA, type DSAAnalysis } from "./dsa";
import { analyzeSD, type SDAnalysis } from "./sd";
import {
  DEFAULT_COACH_PREFS,
  DSA_ACTION_LABEL,
  SD_ACTION_LABEL,
  type CoachPlan,
  type CoachPrefs,
  type DSARecommendation,
  type ModulePlan,
  type PlanStep,
  type SDRecommendation,
} from "./types";

const SOLVE_MINUTES = { Easy: 15, Medium: 30, Hard: 45 } as const;

export const prefsOf = (state: State): CoachPrefs => ({ ...DEFAULT_COACH_PREFS, ...state.settings.coach });

export function interviewDaysLeft(prefs: CoachPrefs, date: string): number | null {
  if (!prefs.interviewDate) return null;
  const d = daysBetween(date, prefs.interviewDate);
  return d >= 0 ? d : null;
}

/**
 * Keep the first `keep` steps (the core of the session), add the rest while they fit,
 * and if the core alone overruns the budget, shorten every step proportionally (5-minute steps, min 5).
 */
function fit(steps: PlanStep[], minutes: number, keep = 2): PlanStep[] {
  const out: PlanStep[] = [];
  let used = 0;
  for (const [i, s] of steps.entries()) {
    if (i < keep || used + s.minutes <= minutes) {
      out.push(s);
      used += s.minutes;
    }
  }
  if (used <= minutes) return out;
  const k = minutes / used;
  return out.map((s) => ({ ...s, minutes: Math.max(5, Math.round((s.minutes * k) / 5) * 5) }));
}

function dsaSteps(r: DSARecommendation, prefs: CoachPrefs): PlanStep[] {
  const pattern = `/patterns/${r.patternId}`;
  const explain = (minutes: number): PlanStep => ({
    id: `explain-${r.patternId}`,
    kind: "explain",
    label: `Explain ${r.patternName} in your own words`,
    detail: "Say when it applies, the invariant, and the template. The coach checks your explanation.",
    minutes,
    href: `/coach/ask?ctx=dsa&tool=explain&pattern=${r.patternId}`,
  });

  if (r.stopSolving) {
    const guided = r.problems[0];
    return [
      { id: `review-${r.patternId}`, kind: "review", label: `Review the ${r.patternName} invariant`, detail: "Re-read the recognition signals, the template and the pitfalls. Compare with the mistakes you noted.", minutes: 10, href: pattern },
      ...(guided
        ? [{ id: `guided-${guided.slug}`, kind: "guided" as const, label: `One guided problem: ${guided.title}`, detail: "Use progressive hints from the coach; stop at the first hint that unblocks you.", minutes: SOLVE_MINUTES[guided.difficulty] + 10, href: `/coach/ask?ctx=dsa&tool=hints&slug=${guided.slug}`, slug: guided.slug }]
        : []),
      explain(5),
    ];
  }

  const steps: PlanStep[] = [];
  if (r.action === "learn") {
    steps.push({ id: `study-${r.patternId}`, kind: "study", label: `Learn ${r.patternName}`, detail: "Read how to recognise it, the core idea and the template.", minutes: 15, href: pattern });
  } else {
    steps.push({ id: `review-${r.patternId}`, kind: "review", label: `Review ${r.patternName}`, detail: "Skim the signals and template before solving.", minutes: 10, href: pattern });
  }
  const solveCount = Math.max(1, prefs.dailyProblems);
  r.problems.slice(0, solveCount + 1).forEach((p, i) => {
    const isExtra = i >= solveCount;
    const kind: PlanStep["kind"] = p.role === "variation" || p.role === "harder" || isExtra ? "variation" : p.role === "due" ? "revise" : "solve";
    const verb = kind === "revise" ? "Revise" : kind === "variation" ? "Practise a variation" : `Solve ${p.difficulty === "Easy" ? "an" : "a"} ${p.difficulty} problem`;
    steps.push({ id: `solve-${p.slug}`, kind, label: `${verb}: ${p.title}`, detail: `${p.why} Teaches: ${p.teaches}`, minutes: SOLVE_MINUTES[p.difficulty], href: p.href, slug: p.slug });
  });
  steps.push(explain(5));
  return steps;
}

function dsaPlan(a: DSAAnalysis, prefs: CoachPrefs, minutes: number): ModulePlan | null {
  const r = a.focus;
  if (!r) return null;
  const steps = fit(dsaSteps(r, prefs), minutes, r.stopSolving ? 3 : 2);
  const s = a.secondary;
  const after = s
    ? {
        title: `${s.action === "learn" ? "Learn" : s.facts.due || (s.facts.daysSince ?? 0) >= 7 ? "Revise" : DSA_ACTION_LABEL[s.action]} ${s.patternName}`,
        reason: s.facts.due
          ? `${s.facts.due} problem${s.facts.due === 1 ? " is" : "s are"} due for review.`
          : (s.facts.daysSince ?? 0) >= 7
            ? `It has not been practised for ${s.facts.daysSince} days.`
            : (s.reasons[1] ?? s.reasons[0] ?? "Next highest priority."),
        href: `/patterns/${s.patternId}`,
      }
    : undefined;
  return {
    module: "dsa",
    minutes,
    focusTitle: r.patternName,
    actionLabel: DSA_ACTION_LABEL[r.action],
    priority: r.priority,
    level: r.level,
    signals: r.signals,
    why: r.reasons,
    steps,
    after,
    avoid: a.avoid,
    stopMessage: r.stopSolving
      ? `Don't solve another problem yet. You've struggled with ${r.patternName} on ${r.facts.recentStruggledProblems} different problems recently. Spend 10 minutes on the invariant, then try one guided problem.`
      : undefined,
  };
}

function sdSteps(r: SDRecommendation): PlanStep[] {
  const ex = r.exercises[0];
  const interview = (target: { key: string; title: string }, minutes: number): PlanStep => ({
    id: `interview-${target.key}`,
    kind: "interview",
    label: `AI interview simulation: ${target.title}`,
    detail: "The coach plays the interviewer and challenges your decisions.",
    minutes,
    href: `/coach/interview?ctx=sd&item=${encodeURIComponent(target.key)}`,
    sdKey: target.key,
  });
  const explain: PlanStep = {
    id: `explain-${r.key}`,
    kind: "explain",
    label: "Explain your decision",
    detail: `Say why you chose ${r.title} and what you gave up. The coach checks it.`,
    minutes: 10,
    href: `/coach/ask?ctx=sd&tool=explain&item=${encodeURIComponent(r.key)}`,
  };

  switch (r.action) {
    case "review-concept":
      return [
        { id: `review-${r.key}`, kind: "review", label: `Re-learn ${r.title}`, detail: "Read it again slowly: what it is, why it exists, how it works.", minutes: 15, href: r.href, sdKey: r.key },
        { id: `tradeoffs-${r.key}`, kind: "study", label: "Write down the trade-offs", detail: "Pros, cons and when not to use it, in your own words.", minutes: 10, href: r.href },
        explain,
      ];
    case "learn":
      return [
        { id: `study-${r.key}`, kind: "study", label: `Learn ${r.title}`, detail: "Then rate how well you understood it.", minutes: 20, href: r.href, sdKey: r.key },
        ...(ex ? [{ id: `design-${ex.key}`, kind: "design" as const, label: `Spot it in a design: ${ex.title}`, detail: ex.why, minutes: 20, href: ex.href, sdKey: ex.key }] : []),
        explain,
      ];
    case "practice":
    case "interview":
      return [
        { id: `review-${r.key}`, kind: "review", label: `Re-read your ${r.title} workspace`, detail: "Requirements, estimates and the decisions you made last time.", minutes: 10, href: r.href },
        ...(r.action === "practice" ? [{ id: `design-${r.key}`, kind: "design" as const, label: `Redesign ${r.title} from a blank page`, detail: "Then compare with your saved workspace.", minutes: 35, href: r.href, sdKey: r.key }] : []),
        interview(r, 30),
      ];
    default:
      return [
        { id: `review-${r.key}`, kind: "review", label: `Review ${r.title}`, detail: "Then rate it to schedule the next review.", minutes: 10, href: r.href, sdKey: r.key },
        { id: `tradeoffs-${r.key}`, kind: "study", label: "Understand the trade-offs", detail: "When would you not use it? What does it cost?", minutes: 10, href: r.href },
        ...(ex ? [{ id: `design-${ex.key}`, kind: "design" as const, label: `Design exercise: ${ex.title}`, detail: ex.why, minutes: 30, href: ex.href, sdKey: ex.key }] : []),
        explain,
        ...(ex ? [interview(ex, 20)] : []),
      ];
  }
}

function sdPlan(a: SDAnalysis, minutes: number): ModulePlan | null {
  const r = a.focus;
  if (!r) return null;
  const s = a.secondary;
  return {
    module: "sd",
    minutes,
    focusTitle: r.title,
    actionLabel: SD_ACTION_LABEL[r.action],
    priority: r.priority,
    level: r.level,
    signals: r.signals,
    why: r.reasons,
    steps: fit(sdSteps(r), minutes, r.action === "revise" || r.action === "apply" ? 3 : 2),
    after: s
      ? {
          title: `${s.action === "learn" ? "Learn" : "Revise"} ${s.title}`,
          reason: s.facts.due ? "Its review is due." : s.action === "learn" ? s.reasons[0] : `Last reviewed ${s.facts.daysSince} days ago.`,
          href: s.href,
        }
      : undefined,
    avoid: a.avoid,
    stopMessage: r.stopSolving ? `Don't start a new design problem yet. Your last ratings on ${r.title} were low; re-learn it and explain it back first.` : undefined,
  };
}

/** Today's plan for both modules, split by the time preference. Each part uses only its own module's data. */
export function buildCoachPlan(state: State, date: string, prefs: CoachPrefs = prefsOf(state)): CoachPlan {
  const left = interviewDaysLeft(prefs, date);
  const dsaShare = prefs.focus === "dsa" ? 1 : prefs.focus === "sd" ? 0 : 0.6;
  const dsaMinutes = Math.round(prefs.minutes * dsaShare);
  const sdMinutes = prefs.minutes - dsaMinutes;
  return {
    date,
    generatedAt: new Date().toISOString(),
    prefs,
    interviewDaysLeft: left,
    dsa: dsaMinutes > 0 ? dsaPlan(analyzeDSA(state, date, prefs, left), prefs, dsaMinutes) : null,
    sd: sdMinutes > 0 ? sdPlan(analyzeSD(state, date, left), sdMinutes) : null,
  };
}

import "server-only";
import { allPatterns, problemIndex } from "@/data/curriculum";
import { HLD_PROBLEMS, LLD_PROBLEMS, SD_INDEX } from "@/data/sd";
import { analyzeDSA, patternFacts, type DSAAnalysis } from "@/lib/coach/dsa";
import { interviewDaysLeft, prefsOf } from "@/lib/coach/plan";
import { analyzeSD, sdFacts, type SDAnalysis } from "@/lib/coach/sd";
import { DSA_ACTION_LABEL, SD_ACTION_LABEL, type DSARecommendation, type PatternFacts, type SDFacts, type SDRecommendation, type Signal } from "@/lib/coach/types";
import { blankEntryLike, type ServerState } from "./state";

/**
 * Turns the deterministic analysis into compact, factual text blocks for the prompt.
 * The model is told to use only these facts for anything about the user.
 */

const pct = (v: number | null) => (v === null ? "n/a" : `${Math.round(v * 100)}%`);
const days = (n: number | null) => (n === null ? "never" : n === 0 ? "today" : `${n} day${n === 1 ? "" : "s"} ago`);

function signalLine(signals: Signal[]) {
  return signals
    .filter((s) => s.points > 0)
    .map((s) => `${s.label} ${s.points}/${s.weight} (${s.detail})`)
    .join("; ");
}

export function patternFactsBlock(f: PatternFacts): string {
  const lines = [
    `Pattern: ${f.patternName} (topic: ${f.topicName}${f.tier ? `, ${f.tier} interview area` : ""})`,
    `- Solved ${f.solved} of ${f.total} problems (${f.mastered} mastered); ${f.attempts} attempts logged in total.`,
    `- Last 21 days: ${f.recentAttempts} attempts, success ${pct(f.recentSuccess)}, ${f.recentFails} failed, ${f.recentHints} needed hints.`,
    `- Average confidence: ${f.avgConfidence === null ? "not rated" : `${f.avgConfidence.toFixed(1)}/5`}. Last practised: ${days(f.daysSince)}. Due for review: ${f.due}. Self-rating: ${f.selfRating}.`,
    `- Variations covered: ${f.variationsCovered} of ${f.variationsTotal}. By difficulty: ${(["Easy", "Medium", "Hard"] as const)
      .map((d) => `${d} ${f.byDifficulty[d].solved}/${f.byDifficulty[d].total} solved`)
      .join(", ")}.`,
  ];
  if (f.lastAttempts.length) {
    lines.push(`- Most recent attempts: ${f.lastAttempts.map((a) => `${a.title} (${a.difficulty}) ${a.result} on ${a.date}, confidence ${a.confidence}/5`).join("; ")}.`);
  }
  if (f.mistakes.length) lines.push(`- The user's own mistake notes: ${f.mistakes.map((m) => `[${m.title}] "${m.text}"`).join(" ")}`);
  return lines.join("\n");
}

export function dsaRecommendationBlock(r: DSARecommendation): string {
  return [
    `RECOMMENDATION: ${DSA_ACTION_LABEL[r.action]} — ${r.patternName}`,
    `Priority ${r.priority}/100 (${r.level}). Signals: ${signalLine(r.signals) || "none"}.`,
    r.stopSolving ? "STOP RULE: the user keeps struggling with the same idea; recommend reviewing the concept and only ONE guided problem, not more problems." : "",
    `Difficulty: target ${r.difficulty.target} (${r.difficulty.move}). ${r.difficulty.why}`,
    `Reasons (facts): ${r.reasons.join(" ")}`,
    r.problems.length ? `Recommended problems:\n${r.problems.map((p, i) => `${i + 1}. ${p.title} (${p.difficulty}, ${p.role}) — ${p.why} Teaches: ${p.teaches}`).join("\n")}` : "",
    patternFactsBlock(r.facts),
  ]
    .filter(Boolean)
    .join("\n");
}

export function dsaProfileBlock(a: DSAAnalysis): string {
  const p = a.profile;
  const weak = a.ranked.filter((r) => r.signals.find((s) => s.key === "weakness")!.value >= 0.35).slice(0, 4);
  return [
    "DSA PROFILE (facts):",
    `- Problems solved: ${p.problemsSolved}. Attempts in the last 7 days: ${p.attemptsLast7}. Active days in the last 14: ${p.activeDaysLast14}. Last practice: ${days(p.daysSinceLastPractice)}.`,
    `- Patterns started: ${p.patternsStarted} of ${p.patternsTotal}. Core interview patterns not started: ${p.corePatternsUntouched}. Problems due for review: ${p.dueTotal}.`,
    `- Weak patterns: ${weak.length ? weak.map((r) => `${r.patternName} (success ${pct(r.facts.recentSuccess ?? r.facts.overallSuccess)}, confidence ${r.facts.avgConfidence?.toFixed(1) ?? "n/a"})`).join(", ") : "none detected"}.`,
    `- Strong patterns: ${a.strong.length ? a.strong.map((f) => f.patternName).join(", ") : "none yet"}.`,
    `- Highest-priority patterns: ${a.ranked.slice(0, 5).map((r) => `${r.patternName} ${r.priority}`).join(", ") || "none (nothing practised yet)"}.`,
  ].join("\n");
}

export function sdFactsBlock(f: SDFacts): string {
  const lines = [
    `${f.kind === "problem" ? "Design problem" : f.kind === "pattern" ? "Design pattern" : "Concept"}: ${f.title} (${f.track.toUpperCase()}, ${f.group})`,
    `- Status: ${f.status}. Latest rating: ${f.confidence || "not rated"}/5. Ratings so far: ${f.ratings.join(", ") || "none"}. Reviews: ${f.reviewCount}.`,
    `- Last reviewed: ${days(f.daysSince)}. Due: ${f.due ? "yes" : "no"}${f.reviewOff ? " (reviews switched off)" : ""}.`,
  ];
  if (f.linkedProblems) lines.push(`- Linked design problems practised: ${f.linkedPracticed} of ${f.linkedProblems}.`);
  if (f.sessions) lines.push(`- Interview sessions: ${f.sessions}; last confidence ${f.lastSessionConfidence}/5.`);
  if (f.sessionNotes.length) lines.push(`- The user's debrief notes: ${f.sessionNotes.map((n) => `"${n}"`).join(" ")}`);
  if (f.notes) lines.push(`- The user's notes: "${f.notes}"`);
  return lines.join("\n");
}

export function sdRecommendationBlock(r: SDRecommendation): string {
  return [
    `RECOMMENDATION: ${SD_ACTION_LABEL[r.action]} — ${r.title}`,
    `Priority ${r.priority}/100 (${r.level}). Signals: ${signalLine(r.signals) || "none"}.`,
    r.stopSolving ? "STOP RULE: ratings stayed low; recommend re-learning and explaining it back before any new design problem." : "",
    `Reasons (facts): ${r.reasons.join(" ")}`,
    r.exercises.length ? `Exercises: ${r.exercises.map((e) => `${e.title} (${e.track.toUpperCase()}) — ${e.why}`).join("; ")}` : "",
    sdFactsBlock(r.facts),
  ]
    .filter(Boolean)
    .join("\n");
}

export function sdProfileBlock(a: SDAnalysis): string {
  const p = a.profile;
  const weak = a.ranked.filter((r) => r.signals.find((s) => s.key === "weakness")!.value >= 0.35).slice(0, 4);
  return [
    "SYSTEM DESIGN PROFILE (facts):",
    `- HLD items started: ${p.hldStarted} of ${p.hldTotal}. LLD items started: ${p.lldStarted} of ${p.lldTotal}.`,
    `- Design problems practised: ${p.problemsPractised} of ${p.problemsTotal}. Interview sessions: ${p.sessions}. Reviews due: ${p.dueTotal}. Last practice: ${days(p.daysSinceLastPractice)}.`,
    `- Weak items: ${weak.length ? weak.map((r) => `${r.title} (rating ${r.facts.confidence}/5)`).join(", ") : "none detected"}.`,
    `- Strong items: ${a.strong.length ? a.strong.map((f) => f.title).join(", ") : "none yet"}.`,
    `- Highest-priority items: ${a.ranked.slice(0, 5).map((r) => `${r.title} ${r.priority}`).join(", ") || "none (nothing studied yet)"}.`,
  ].join("\n");
}

/* ---------- lookups ---------- */

export function analyses(state: ServerState, date: string) {
  const prefs = prefsOf(state);
  const left = interviewDaysLeft(prefs, date);
  return {
    prefs,
    left,
    dsa: () => analyzeDSA(state, date, prefs, left),
    sd: () => analyzeSD(state, date, left),
  };
}

/** DSA patterns named in free text (by name or id). */
export function mentionedPatterns(text: string) {
  const t = text.toLowerCase();
  return allPatterns.filter(({ pattern, topic }) => t.includes(pattern.name.toLowerCase()) || t.includes(pattern.id.replace(/-/g, " ")) || t.includes(topic.name.toLowerCase())).slice(0, 2);
}

export function factsForPattern(state: ServerState, patternId: string, date: string) {
  const x = allPatterns.find((p) => p.pattern.id === patternId);
  return x ? patternFacts(x.pattern, x.topic, state, date) : null;
}

/** SD items named in free text (by title). */
export function mentionedSDItems(text: string) {
  const t = text.toLowerCase();
  return [...SD_INDEX.values()].filter((x) => x.title.length > 3 && t.includes(x.title.toLowerCase())).slice(0, 2);
}

export function factsForSD(state: ServerState, key: string, date: string) {
  const x = SD_INDEX.get(key);
  return x ? sdFacts(x, state, date) : null;
}

export function dsaProblem(slug: string, state: ServerState) {
  const curated = problemIndex.get(slug);
  if (curated) return { title: curated.problem.title, difficulty: curated.problem.difficulty, takeaway: curated.problem.takeaway, pattern: curated.pattern, entry: state.problems[slug] ?? blankEntryLike() };
  const c = state.custom.find((x) => x.slug === slug);
  if (!c) return null;
  const pattern = allPatterns.find((p) => p.pattern.id === c.patternId)?.pattern;
  return pattern ? { title: c.title, difficulty: c.difficulty, takeaway: c.takeaway, pattern, entry: state.problems[slug] ?? blankEntryLike() } : null;
}

export function sdProblem(key: string, state: ServerState) {
  const id = key.replace(/^problem:/, "");
  const custom = state.sdCustom.find((p) => p.id === id);
  if (custom) return { track: custom.track, title: custom.title, text: custom.statement, deepDives: [] as string[], concepts: [] as string[] };
  const hld = HLD_PROBLEMS.find((p) => p.id === id);
  if (hld) return { track: "hld" as const, title: hld.title, text: [hld.statement, `Functional: ${hld.functional.join("; ")}`, `Non-functional: ${hld.nonFunctional.join("; ")}`].join("\n"), deepDives: hld.deepDives, concepts: hld.concepts };
  const lld = LLD_PROBLEMS.find((p) => p.id === id);
  if (lld) return { track: "lld" as const, title: lld.title, text: [lld.statement, `Functional: ${lld.functional.join("; ")}`, `Actors: ${lld.actors.join(", ")}`].join("\n"), deepDives: lld.extensions, concepts: lld.concepts };
  return null;
}

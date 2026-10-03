/**
 * Deterministic checks for the AI Coach recommendation engine (no model, no database).
 * Builds synthetic progress histories and asserts the coaching rules. Run: npm run check:coach
 */
import { allPatterns } from "../data/curriculum";
import { HLD_PROBLEMS, sdKey } from "../data/sd";
import { addDays } from "../lib/day";
import { analyzeDSA } from "../lib/coach/dsa";
import { buildCoachPlan } from "../lib/coach/plan";
import { analyzeSD } from "../lib/coach/sd";
import { DEFAULT_COACH_PREFS } from "../lib/coach/types";
import type { AttemptResult, Entry, SDEntry, State } from "../lib/progress";

const DATE = "2026-10-03";
let failures = 0;
const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) failures++;
};

const empty = (): State => ({
  problems: {},
  patterns: {},
  custom: [],
  companies: [],
  mocks: [],
  events: [],
  daily: {},
  plans: {},
  checklist: {},
  settings: { name: "", dailyNew: 2, mockTarget: 10, sidebarCollapsed: false, navCollapsed: {}, includeSD: true, sdAutoReview: true },
  sd: {},
  sdCustom: [],
  diagrams: {},
  sdSessions: [],
});

/** An entry with attempts `[daysAgo, result, confidence]`, oldest first. */
function entry(attempts: [number, AttemptResult, number][], extra: Partial<Entry> = {}): Entry {
  const history = attempts.map(([ago, result, confidence], i) => ({
    date: addDays(DATE, -ago),
    at: `${addDays(DATE, -ago)}T10:00:0${i}.000Z`,
    kind: i === 0 ? ("solve" as const) : ("revisit" as const),
    confidence,
    result,
  }));
  const last = attempts.at(-1)!;
  const solved = attempts.some(([, r]) => r !== "failed");
  return {
    status: solved ? "solved" : "attempted",
    understanding: last[2],
    revisit: last[1] === "failed",
    starred: false,
    statement: "",
    approach: "",
    insight: "",
    mistakes: "",
    notes: "",
    code: "",
    language: "python",
    time: "",
    space: "",
    solveCount: solved ? 1 : 0,
    revisitCount: Math.max(0, attempts.length - 1),
    failCount: attempts.filter(([, r]) => r === "failed").length,
    history,
    nextReview: addDays(DATE, 3),
    lastAttemptAt: history.at(-1)!.at,
    updatedAt: history.at(-1)!.at,
    ...extra,
  };
}

const pattern = (id: string) => allPatterns.find((x) => x.pattern.id === id)!.pattern;

// ---------- 1. Empty state: learn something new, no invented focus ----------
{
  const a = analyzeDSA(empty(), DATE, DEFAULT_COACH_PREFS, null);
  ok(a.ranked.length === 0, "empty: nothing ranked");
  ok(a.focus?.action === "learn", `empty: focus is to learn (${a.focus?.patternName})`);
  ok(a.focus?.problems[0]?.difficulty === "Easy", "empty: starts with an Easy problem");
}

// ---------- 2. Repeated struggle → stop rule (don't recommend more problems) ----------
const sw = pattern("variable-longest");
{
  const s = empty();
  const [p1, p2, p3] = sw.problems;
  s.problems[p1.slug] = entry([[20, "solved", 3], [6, "failed", 1]], { mistakes: "Shrunk the window before updating the answer" });
  s.problems[p2.slug] = entry([[4, "hints", 2]]);
  s.problems[p3.slug] = entry([[1, "failed", 1]]);
  const a = analyzeDSA(s, DATE, DEFAULT_COACH_PREFS, null);
  const r = a.ranked.find((x) => x.patternId === sw.id)!;
  ok(r.stopSolving && r.action === "review-concept", `stuck: review the concept first (action ${r.action})`);
  ok(r.problems.length === 1 && r.problems[0].role === "guided", "stuck: exactly one guided problem");
  ok(r.difficulty.move === "fundamentals", "stuck: back to fundamentals");
  ok(a.focus?.patternId === sw.id, "stuck pattern becomes today's focus");
  ok(a.avoid.some((x) => x.includes("Don't start more")), "stuck: avoid list says not to start more problems");
  ok(r.facts.mistakes[0]?.text.includes("Shrunk"), "user's own mistake notes are carried as facts");
  const plan = buildCoachPlan(s, DATE, { ...DEFAULT_COACH_PREFS, focus: "dsa" });
  ok(!!plan.dsa?.stopMessage && plan.dsa.steps.filter((x) => x.kind === "solve" || x.kind === "variation").length === 0, "stuck plan has no extra solve steps");
}

// ---------- 3. Due reviews → revise; overdue raises priority ----------
const bs = pattern("classic-boundary");
{
  const s = empty();
  const [p1, p2] = bs.problems;
  s.problems[p1.slug] = entry([[30, "solved", 4], [12, "solved", 4]], { nextReview: addDays(DATE, -5) });
  s.problems[p2.slug] = entry([[25, "solved", 4]], { nextReview: addDays(DATE, -1) });
  const a = analyzeDSA(s, DATE, DEFAULT_COACH_PREFS, null);
  const r = a.ranked.find((x) => x.patternId === bs.id)!;
  ok(r.action === "revise", `due: action is revise (${r.action})`);
  ok(r.problems[0].role === "due", "due: first recommended problem is a due one");
  ok(r.signals.find((x) => x.key === "revision")!.points > 0, "due: revision signal contributes");
  ok(r.signals.find((x) => x.key === "recency")!.points > 0, "12 days since practice: recency signal contributes");
}

// ---------- 4. Consistent success → harder variation ----------
const fw = allPatterns.find((x) => x.pattern.problems.filter((p) => p.difficulty === "Easy").length >= 3 && x.pattern.problems.some((p) => p.difficulty === "Medium"))!.pattern;
{
  const s = empty();
  fw.problems.filter((p) => p.difficulty === "Easy").slice(0, 3).forEach((p, i) => (s.problems[p.slug] = entry([[5 - i, "solved", 5]])));
  const a = analyzeDSA(s, DATE, DEFAULT_COACH_PREFS, null);
  const r = a.ranked.find((x) => x.patternId === fw.id);
  if (r && r.facts.byDifficulty.Easy.recent >= 2) {
    ok(r.difficulty.move === "harder" && r.difficulty.target === "Medium", `success at Easy → Medium (${r.difficulty.move} ${r.difficulty.target})`);
    ok(!r.problems.some((p) => s.problems[p.slug]), "recommends only unsolved problems");
  } else ok(false, `${fw.name} needs 2+ Easy problems for this check`);
}

// ---------- 5. Low success at Medium → easier ----------
{
  const s = empty();
  const meds = allPatterns.flatMap((x) => x.pattern.problems.filter((p) => p.difficulty === "Medium").map((p) => ({ p, id: x.pattern.id })));
  const pid = meds[0].id;
  const two = meds.filter((m) => m.id === pid).slice(0, 2);
  two.forEach(({ p }, i) => (s.problems[p.slug] = entry([[3 + i * 8, "failed", 1]])));
  const r = analyzeDSA(s, DATE, DEFAULT_COACH_PREFS, null).ranked.find((x) => x.patternId === pid)!;
  ok(r.difficulty.move === "easier" && r.difficulty.target === "Easy", `failing Medium → Easy (${r.difficulty.move})`);
}

// ---------- 6. Preferences: difficulty override, interview countdown ----------
{
  const s = empty();
  s.problems[bs.problems[0].slug] = entry([[2, "solved", 3]]);
  const r = analyzeDSA(s, DATE, { ...DEFAULT_COACH_PREFS, difficulty: "Hard" }, null).ranked[0];
  ok(r.difficulty.target === "Hard", "difficulty preference overrides adaptive target");
  const a = analyzeDSA(s, DATE, DEFAULT_COACH_PREFS, 5);
  ok(a.avoid.some((x) => x.includes("interview is in 5 days")), "interview soon: avoid list mentions it");
  ok(a.focus?.action !== "learn", "interview soon: focus stays on revision, not new material");
}

// ---------- 7. Time budget ----------
{
  const s = empty();
  s.problems[bs.problems[0].slug] = entry([[2, "hints", 2]]);
  const short = buildCoachPlan(s, DATE, { ...DEFAULT_COACH_PREFS, minutes: 30, focus: "dsa" });
  const long = buildCoachPlan(s, DATE, { ...DEFAULT_COACH_PREFS, minutes: 180, focus: "dsa", dailyProblems: 3 });
  ok((long.dsa?.steps.length ?? 0) > (short.dsa?.steps.length ?? 0), `more time → more steps (${short.dsa?.steps.length} vs ${long.dsa?.steps.length})`);
  ok(short.sd === null && long.sd === null, "DSA-only focus produces no System Design plan");
  const balanced = buildCoachPlan(s, DATE, { ...DEFAULT_COACH_PREFS, minutes: 100 });
  ok(balanced.dsa?.minutes === 60 && balanced.sd?.minutes === 40, "balanced focus splits time 60/40");
}

// ---------- 8. System Design: studied but never applied → apply in a design ----------
{
  const s = empty();
  const problem = HLD_PROBLEMS.find((p) => p.concepts.length)!;
  const concept = problem.concepts[0];
  const key = sdKey("concept", concept);
  const sd: SDEntry = {
    status: "done",
    confidence: 4,
    starred: false,
    notes: "",
    reviewCount: 0,
    lastReviewed: `${addDays(DATE, -4)}T09:00:00.000Z`,
    nextReview: addDays(DATE, 3),
    history: [{ date: addDays(DATE, -4), at: `${addDays(DATE, -4)}T09:00:00.000Z`, kind: "study", rating: 4 }],
    updatedAt: `${addDays(DATE, -4)}T09:00:00.000Z`,
  };
  s.sd[key] = sd;
  const a = analyzeSD(s, DATE, null);
  const r = a.ranked.find((x) => x.key === key)!;
  ok(r.action === "apply", `studied, never applied → apply (${r.action})`);
  ok(r.exercises.some((e) => e.key === sdKey("problem", problem.id)), "apply: suggests a design problem that uses it");
  ok(a.profile.hldStarted === 1, "SD profile counts only SD data");
  ok(analyzeDSA(s, DATE, DEFAULT_COACH_PREFS, null).ranked.length === 0, "SD progress never leaks into DSA analysis");

  // Low ratings twice → re-learn first
  s.sd[key] = { ...sd, confidence: 2, history: [...sd.history, { date: addDays(DATE, -1), at: `${addDays(DATE, -1)}T09:00:00.000Z`, kind: "review", rating: 2 }, { date: DATE, at: `${DATE}T09:00:00.000Z`, kind: "review", rating: 1 }] };
  const r2 = analyzeSD(s, DATE, null).ranked.find((x) => x.key === key)!;
  ok(r2.stopSolving && r2.action === "review-concept", "SD repeated low ratings → re-learn before new designs");
}

// ---------- 9. Reviews switched off are never "due" ----------
{
  const s = empty();
  const key = sdKey("concept", HLD_PROBLEMS[0].concepts[0]);
  s.sd[key] = { status: "done", confidence: 3, starred: false, notes: "", reviewCount: 1, reviewOff: true, history: [{ date: addDays(DATE, -20), at: `${addDays(DATE, -20)}T09:00:00.000Z`, kind: "study", rating: 3 }], updatedAt: "" };
  const r = analyzeSD(s, DATE, null).ranked.find((x) => x.key === key)!;
  ok(!r.facts.due && r.signals.find((x) => x.key === "recency")!.points === 0, "reviewOff: not due and no recency pressure");
}

// ---------- 10. Active struggle outranks a stale-but-solid pattern ----------
{
  const s = empty();
  const vl = pattern("variable-longest");
  const [a, b] = vl.problems.filter((p) => p.difficulty === "Medium");
  s.problems[a.slug] = entry([[16, "solved", 3], [5, "failed", 1]]);
  s.problems[b.slug] = entry([[3, "hints", 2]]);
  const [x, y] = bs.problems;
  s.problems[x.slug] = entry([[24, "solved", 4]], { nextReview: addDays(DATE, -6) });
  s.problems[y.slug] = entry([[23, "solved", 4]], { nextReview: addDays(DATE, -4) });
  const an = analyzeDSA(s, DATE, DEFAULT_COACH_PREFS, null);
  ok(an.focus?.patternId === vl.id && an.focus.action === "strengthen", `recent struggle beats stale revision (focus ${an.focus?.patternName}, ${an.focus?.action})`);
  ok(an.secondary?.patternId === bs.id, "the stale, due pattern becomes the after-today pick");
  const plan = buildCoachPlan(s, DATE, { ...DEFAULT_COACH_PREFS, focus: "dsa" });
  ok(!!plan.dsa?.after && /due for review/.test(plan.dsa.after.reason), `after-today reason is factual (${plan.dsa?.after?.reason})`);
}

// ---------- 10b. Short budgets shorten steps instead of dropping the core ----------
{
  const s = empty();
  s.sd["concept:replication"] = { status: "done", confidence: 4, starred: false, notes: "", reviewCount: 0, lastReviewed: `${addDays(DATE, -8)}T09:00:00.000Z`, nextReview: addDays(DATE, 3), history: [{ date: addDays(DATE, -8), at: `${addDays(DATE, -8)}T09:00:00.000Z`, kind: "study", rating: 4 }], updatedAt: "" };
  const p = buildCoachPlan(s, DATE, { ...DEFAULT_COACH_PREFS, focus: "sd", minutes: 30 }).sd!;
  const total = p.steps.reduce((a, x) => a + x.minutes, 0);
  ok(p.steps.some((x) => x.kind === "design") && total <= 35, `30-min SD plan keeps the design exercise (${p.steps.map((x) => `${x.kind}:${x.minutes}`).join(", ")})`);
}

// ---------- 11. SD: studied-but-unapplied beats learning something new ----------
{
  const s = empty();
  const key = "concept:replication";
  s.sd[key] = { status: "done", confidence: 4, starred: false, notes: "", reviewCount: 0, lastReviewed: `${addDays(DATE, -8)}T09:00:00.000Z`, nextReview: addDays(DATE, 3), history: [{ date: addDays(DATE, -8), at: `${addDays(DATE, -8)}T09:00:00.000Z`, kind: "study", rating: 4 }], updatedAt: "" };
  const an = analyzeSD(s, DATE, null);
  ok(an.focus?.key === key && an.focus.action === "apply", `replication studied, never applied → today's focus is applying it (${an.focus?.title}, ${an.focus?.action})`);
}

console.log(failures ? `\n${failures} failure(s)` : "\nAll coach checks passed");
process.exit(failures ? 1 : 0);

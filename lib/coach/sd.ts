import { HLD_PATTERNS, HLD_PROBLEMS, LLD_PATTERNS, LLD_PROBLEMS, conceptById, sdKey, type SDItem } from "@/data/sd";
import { SD_PHASES } from "@/data/sd/study-plan";
import { daysBetween } from "@/lib/day";
import type { SDEntry, State } from "@/lib/progress";
import { sdItemsFor } from "@/lib/sd-items";
import { levelOf, type SDAction, type SDExercise, type SDFacts, type SDRecommendation, type Signal } from "./types";

/**
 * Deterministic System Design recommendation engine. Reads only System Design progress
 * (sd, sdSessions, diagrams); DSA data never enters this module.
 */

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Design problems that exercise each concept or pattern (from the curriculum's cross-links). */
const LINKED = new Map<string, Set<string>>();
const link = (from: string, problemKey: string) => {
  if (!LINKED.has(from)) LINKED.set(from, new Set());
  LINKED.get(from)!.add(problemKey);
};
for (const p of HLD_PROBLEMS) {
  for (const c of p.concepts) link(sdKey("concept", c), sdKey("problem", p.id));
  for (const pat of p.patterns) link(sdKey("pattern", pat), sdKey("problem", p.id));
}
for (const p of LLD_PROBLEMS) {
  for (const c of p.concepts) link(sdKey("concept", c), sdKey("problem", p.id));
  for (const pat of p.patterns) link(sdKey("pattern", pat), sdKey("problem", p.id));
}
for (const p of HLD_PATTERNS) for (const id of p.problems) link(sdKey("pattern", p.id), sdKey("problem", id));
for (const p of LLD_PATTERNS) for (const id of p.problems) link(sdKey("pattern", p.id), sdKey("problem", id));
// Concepts reach design problems through the architecture patterns that use them (e.g. replication → Read Replication → problems).
for (const p of HLD_PATTERNS) for (const c of p.concepts) for (const id of p.problems) link(sdKey("concept", c), sdKey("problem", id));

/** Roadmap position: earlier phases matter more (foundations before practice). */
function phaseIndex(x: SDItem): number {
  if (x.kind === "concept") {
    const cat = conceptById.get(x.id)?.category ?? "";
    const i = SD_PHASES.findIndex((p) => p.categories.includes(cat));
    return i === -1 ? SD_PHASES.length - 1 : i;
  }
  const i = SD_PHASES.findIndex((p) => p.kinds?.includes(x.kind));
  return i === -1 ? SD_PHASES.length - 1 : i;
}

const isPracticed = (e?: SDEntry) =>
  !!e && (e.status === "done" || e.status === "mastered" || e.history.some((h) => h.kind === "practice" || h.kind === "session"));

export function sdFacts(x: SDItem, state: State, date: string): SDFacts {
  const e = state.sd[x.key];
  const lastReviewed = e?.lastReviewed ? e.lastReviewed.slice(0, 10) : (e?.history.at(-1)?.date ?? null);
  const linked = [...(LINKED.get(x.key) ?? [])];
  const sessions = state.sdSessions.filter((s) => s.itemKey === x.key).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const due = !!e?.nextReview && !e.reviewOff && e.history.length > 0 && e.nextReview <= date;
  return {
    key: x.key,
    kind: x.kind,
    track: x.track,
    title: x.title,
    group: x.group,
    status: e?.status ?? "todo",
    confidence: e?.confidence ?? 0,
    ratings: (e?.history ?? []).map((h) => h.rating),
    reviewCount: e?.reviewCount ?? 0,
    lastReviewed,
    daysSince: lastReviewed ? daysBetween(lastReviewed, date) : null,
    due,
    overdueDays: due ? daysBetween(e!.nextReview!, date) : 0,
    reviewOff: !!e?.reviewOff,
    linkedProblems: linked.length,
    linkedPracticed: linked.filter((k) => isPracticed(state.sd[k])).length,
    sessions: sessions.length,
    lastSessionConfidence: sessions.at(-1)?.confidence ?? null,
    sessionNotes: sessions
      .slice(-2)
      .flatMap((s) => [s.missing, s.toRevise])
      .map((t) => t?.trim())
      .filter((t): t is string => !!t)
      .map((t) => t.slice(0, 200)),
    notes: (e?.notes ?? "").trim().slice(0, 300),
  };
}

function signalsFor(f: SDFacts, x: SDItem): Signal[] {
  const sig = (key: Signal["key"], label: string, weight: number, value: number, detail: string): Signal => {
    const v = clamp(value);
    return { key, label, weight, value: v, points: Math.round(weight * v), detail };
  };
  const lowRating = f.confidence > 0 ? clamp((3.5 - f.confidence) / 2.5) : 0;
  const lowSession = f.lastSessionConfidence !== null && f.lastSessionConfidence > 0 ? clamp((3.5 - f.lastSessionConfidence) / 2.5) : 0;
  const weakness = Math.max(lowRating, lowSession);
  const weakDetail = [
    f.confidence ? `latest rating ${f.confidence}/5` : "",
    f.lastSessionConfidence ? `last interview session ${f.lastSessionConfidence}/5` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const ratings = f.ratings;
  const trend = ratings.length >= 2 && ratings.at(-1)! < ratings.at(-2)! ? clamp((ratings.at(-2)! - ratings.at(-1)!) / 3) : 0;
  const applicationGap =
    (x.kind === "concept" || x.kind === "pattern") && f.status !== "todo" && f.linkedProblems > 0 && f.linkedPracticed === 0 ? 1 : 0;
  const recency = f.reviewOff || f.daysSince === null ? 0 : clamp((f.daysSince - 3) / 25);
  const importance = 1 - 0.12 * phaseIndex(x);
  return [
    sig("revision", "Due for revision", 25, f.due ? clamp(0.7 + 0.03 * f.overdueDays) : 0, f.due ? (f.overdueDays ? `${plural(f.overdueDays, "day")} overdue` : "Due today") : f.reviewOff ? "Reviews switched off" : "Not due"),
    sig("weakness", "Weakness", 30, weakness, weakDetail || "No weak rating recorded"),
    sig("application", "Not yet applied", 20, applicationGap, applicationGap ? `Studied, but none of the ${plural(f.linkedProblems, "linked design problem")} practised yet` : f.linkedProblems ? `${f.linkedPracticed} of ${f.linkedProblems} linked problems practised` : "No linked problems"),
    sig("recency", "Time since review", 10, recency, f.daysSince === null ? "Never reviewed" : `Last reviewed ${f.daysSince === 0 ? "today" : `${plural(f.daysSince, "day")} ago`}`),
    sig("importance", "Roadmap importance", 10, importance, `Phase ${phaseIndex(x) + 1}: ${SD_PHASES[phaseIndex(x)].name}`),
    sig("trend", "Recent performance", 5, trend, trend ? "Your latest rating dropped" : "Stable or improving"),
  ];
}

function chooseAction(f: SDFacts, x: SDItem, signals: Signal[]): { action: SDAction; stuck: boolean } {
  const v = (k: Signal["key"]) => signals.find((s) => s.key === k)!.value;
  const lowRatings = f.ratings.slice(-3).filter((r) => r <= 2).length;
  const stuck = lowRatings >= 2 && f.ratings.length >= 2;
  if (stuck && x.kind !== "problem") return { action: "review-concept", stuck: true };
  if (x.kind === "problem") {
    if (v("weakness") >= 0.4 || f.due) return { action: "practice", stuck };
    if (isPracticedFacts(f) && f.sessions === 0) return { action: "interview", stuck: false };
    return { action: "practice", stuck: false };
  }
  if (v("application") === 1 && v("weakness") < 0.5) return { action: "apply", stuck: false };
  return { action: "revise", stuck: false };
}

const isPracticedFacts = (f: SDFacts) => f.status === "done" || f.status === "mastered";

function reasonsFor(f: SDFacts, action: SDAction): string[] {
  const out: string[] = [];
  if (f.ratings.length) out.push(`You've rated ${f.title} ${plural(f.ratings.length, "time")}; the latest rating is ${f.confidence}/5.`);
  if (f.due) out.push(f.overdueDays ? `Its review is ${plural(f.overdueDays, "day")} overdue.` : "Its review is due today.");
  if (action === "apply") out.push(`You studied it, but haven't practised any of the ${plural(f.linkedProblems, "design problem")} that use it.`);
  if (f.lastSessionConfidence !== null) out.push(`Your last interview session on it ended at ${f.lastSessionConfidence}/5.`);
  if (action === "interview") out.push("You've completed the design but never done a timed interview on it.");
  if (f.daysSince !== null && f.daysSince >= 10) out.push(`You last reviewed it ${f.daysSince} days ago.`);
  if (f.sessionNotes.length) out.push(`Your own debrief noted: “${f.sessionNotes[0]}”.`);
  return out;
}

function exercisesFor(x: SDItem, state: State, all: Map<string, SDItem>, action: SDAction): SDExercise[] {
  if (x.kind === "problem") {
    return [{ key: x.key, title: x.title, href: x.href, track: x.track, why: action === "interview" ? "Run it as a timed mock interview." : "Redo the design in its workspace." }];
  }
  const linked = [...(LINKED.get(x.key) ?? [])]
    .map((k) => all.get(k))
    .filter((p): p is SDItem => !!p)
    .sort((a, b) => Number(isPracticed(state.sd[a.key])) - Number(isPracticed(state.sd[b.key])));
  return linked.slice(0, 2).map((p) => ({
    key: p.key,
    title: p.title,
    href: p.href,
    track: p.track,
    why: isPracticed(state.sd[p.key]) ? `Revisit ${p.title} and point out where ${x.title} fits.` : `Uses ${x.title}; you haven't practised it yet.`,
  }));
}

export interface SDAnalysis {
  date: string;
  ranked: SDRecommendation[];
  learn: SDRecommendation[];
  focus: SDRecommendation | null;
  secondary: SDRecommendation | null;
  avoid: string[];
  strong: SDFacts[];
  profile: {
    hldStarted: number;
    hldTotal: number;
    lldStarted: number;
    lldTotal: number;
    problemsPractised: number;
    problemsTotal: number;
    sessions: number;
    dueTotal: number;
    daysSinceLastPractice: number | null;
  };
}

export function analyzeSD(state: State, date: string, interviewDaysLeft: number | null): SDAnalysis {
  const items = sdItemsFor(state);
  const byKey = new Map(items.map((x) => [x.key, x]));
  const started = items.filter((x) => state.sd[x.key]?.history.length);

  const make = (x: SDItem, action: SDAction, signals: Signal[], stuck: boolean, f: SDFacts, reasons: string[]): SDRecommendation => {
    const priority = Math.min(100, signals.reduce((a, s) => a + s.points, 0) + (stuck ? 10 : 0));
    return {
      module: "sd",
      key: x.key,
      title: x.title,
      kind: x.kind,
      track: x.track,
      href: x.href,
      action,
      priority,
      level: levelOf(priority),
      signals,
      reasons,
      exercises: exercisesFor(x, state, byKey, action),
      stopSolving: stuck,
      facts: f,
    };
  };

  const ranked = started
    .filter((x) => x.kind !== "diagram" || state.sd[x.key]?.nextReview)
    .map((x) => {
      const f = sdFacts(x, state, date);
      const signals = signalsFor(f, x);
      const { action, stuck } = chooseAction(f, x, signals);
      return make(x, action, signals, stuck, f, reasonsFor(f, action));
    })
    .sort((a, b) => b.priority - a.priority);

  // Next untouched items on the roadmap, alternating HLD and LLD.
  const untouched = items
    .filter((x) => x.kind !== "diagram" && !state.sd[x.key]?.history.length && !(x.kind === "problem" && x.id.startsWith("sdc-")))
    .sort((a, b) => phaseIndex(a) - phaseIndex(b));
  const nextHLD = untouched.find((x) => x.track === "hld");
  const nextLLD = untouched.find((x) => x.track === "lld");
  const learn = [nextHLD, nextLLD]
    .filter((x): x is SDItem => !!x)
    .map((x) => {
      const f = sdFacts(x, state, date);
      const signals = signalsFor(f, x);
      return make(x, "learn", signals, false, f, [`It's next on your ${x.track.toUpperCase()} roadmap (${SD_PHASES[phaseIndex(x)].name}).`]);
    });

  const dueTotal = items.filter((x) => {
    const e = state.sd[x.key];
    return !!e?.nextReview && !e.reviewOff && e.history.length > 0 && e.nextReview <= date;
  }).length;
  const interviewSoon = interviewDaysLeft !== null && interviewDaysLeft <= 14;
  const top = ranked[0];
  const focus = top && (top.priority >= 30 || top.stopSolving || dueTotal > 0 || interviewSoon || !learn.length) ? top : (learn[0] ?? top ?? null);
  const secondary = ranked.find((r) => r !== focus && (r.facts.due || (r.facts.daysSince ?? 0) >= 10)) ?? learn.find((l) => l !== focus) ?? null;

  const strong = started
    .map((x) => sdFacts(x, state, date))
    .filter((f) => f.confidence >= 4 && f.ratings.slice(-2).every((r) => r >= 4))
    .sort((a, b) => b.confidence - a.confidence);

  const avoid: string[] = [];
  if (focus?.stopSolving) avoid.push(`Don't start a new design problem yet: re-learn ${focus.title} first; your last ratings were low.`);
  if (dueTotal >= 5) avoid.push(`Hold off on new concepts: ${dueTotal} reviews are due.`);
  if (interviewSoon) avoid.push(`Your interview is in ${plural(interviewDaysLeft!, "day")}: practise full designs instead of reading new concepts.`);
  const problems = items.filter((x) => x.kind === "problem");
  const lastDates = Object.values(state.sd).flatMap((e) => e.history.map((h) => h.date)).sort();
  const last = lastDates.at(-1) ?? null;

  return {
    date,
    ranked,
    learn,
    focus,
    secondary,
    avoid,
    strong: strong.slice(0, 5),
    profile: {
      hldStarted: started.filter((x) => x.track === "hld" && x.kind !== "diagram").length,
      hldTotal: items.filter((x) => x.track === "hld" && x.kind !== "diagram").length,
      lldStarted: started.filter((x) => x.track === "lld").length,
      lldTotal: items.filter((x) => x.track === "lld").length,
      problemsPractised: problems.filter((x) => isPracticed(state.sd[x.key])).length,
      problemsTotal: problems.length,
      sessions: state.sdSessions.length,
      dueTotal,
      daysSinceLastPractice: last ? daysBetween(last, date) : null,
    },
  };
}

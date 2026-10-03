import type { Difficulty } from "@/data/types";

/** Which preparation module the coach is working in. The two never share context. */
export type CoachCtx = "dsa" | "sd";

export interface CoachPrefs {
  /** Minutes available per day. */
  minutes: number;
  focus: "balanced" | "dsa" | "sd";
  difficulty: "auto" | Difficulty;
  /** yyyy-mm-dd */
  interviewDate?: string;
  /** Problems to aim for per day (DSA). */
  dailyProblems: number;
}

export const DEFAULT_COACH_PREFS: CoachPrefs = { minutes: 90, focus: "balanced", difficulty: "auto", dailyProblems: 2 };

/** One ingredient of a practice priority, so every score can be explained. */
export interface Signal {
  key: "revision" | "weakness" | "recency" | "importance" | "coverage" | "trend" | "application";
  label: string;
  /** Maximum points this signal can add. */
  weight: number;
  /** 0–1 strength. */
  value: number;
  /** weight × value, rounded. */
  points: number;
  detail: string;
}

export type PriorityLevel = "high" | "medium" | "low";

export const levelOf = (priority: number): PriorityLevel => (priority >= 55 ? "high" : priority >= 30 ? "medium" : "low");

/* ---------- DSA ---------- */

export type DSAAction = "review-concept" | "revise" | "strengthen" | "broaden" | "advance" | "learn";

export const DSA_ACTION_LABEL: Record<DSAAction, string> = {
  "review-concept": "Review the concept first",
  revise: "Revise",
  strengthen: "Strengthen",
  broaden: "Cover more variations",
  advance: "Level up",
  learn: "Learn something new",
};

export interface DSAAttempt {
  slug: string;
  title: string;
  difficulty: Difficulty;
  date: string;
  result: "solved" | "hints" | "failed" | "reviewed";
  confidence: number;
}

export interface PatternFacts {
  patternId: string;
  patternName: string;
  topicId: string;
  topicName: string;
  tier: "core" | "common" | "advanced" | null;
  /** Interview-essential problems in this pattern. */
  essentials: number;
  total: number;
  /** Problems with at least one attempt. */
  touched: number;
  solved: number;
  mastered: number;
  attempts: number;
  recentAttempts: number;
  /** Share of successful attempts (hints count half) in the last 21 days; null without recent attempts. */
  recentSuccess: number | null;
  overallSuccess: number | null;
  recentFails: number;
  recentHints: number;
  /** Distinct problems failed or solved with hints recently. */
  recentStruggledProblems: number;
  avgConfidence: number | null;
  due: number;
  maxOverdueDays: number;
  lastPracticed: string | null;
  daysSince: number | null;
  selfRating: "unrated" | "learning" | "understood" | "needs-practice";
  /** Each curated problem teaches one variation (its takeaway). */
  variationsCovered: number;
  variationsTotal: number;
  byDifficulty: Record<Difficulty, { solved: number; total: number; recent: number; recentSuccess: number | null }>;
  /** The user's own "mistakes" notes for problems in this pattern (private; trimmed). */
  mistakes: { title: string; text: string }[];
  lastAttempts: DSAAttempt[];
}

export interface RecProblem {
  slug: string;
  title: string;
  difficulty: Difficulty;
  href: string;
  role: "due" | "retry" | "guided" | "new" | "variation" | "harder";
  why: string;
  /** The variation this problem teaches. */
  teaches: string;
}

export interface DSARecommendation {
  module: "dsa";
  patternId: string;
  patternName: string;
  topicName: string;
  action: DSAAction;
  priority: number;
  level: PriorityLevel;
  signals: Signal[];
  reasons: string[];
  difficulty: { target: Difficulty; move: "stay" | "harder" | "easier" | "fundamentals"; why: string };
  problems: RecProblem[];
  /** Repeated struggle: review before solving anything else. */
  stopSolving: boolean;
  facts: PatternFacts;
}

/* ---------- System Design ---------- */

export type SDAction = "review-concept" | "revise" | "apply" | "practice" | "interview" | "learn";

export const SD_ACTION_LABEL: Record<SDAction, string> = {
  "review-concept": "Review the concept first",
  revise: "Revise",
  apply: "Apply it in a design",
  practice: "Redo the design",
  interview: "Interview simulation",
  learn: "Learn something new",
};

export interface SDFacts {
  key: string;
  kind: "concept" | "pattern" | "problem" | "diagram";
  track: "hld" | "lld";
  title: string;
  group: string;
  status: "todo" | "learning" | "done" | "mastered";
  confidence: number;
  ratings: number[];
  reviewCount: number;
  lastReviewed: string | null;
  daysSince: number | null;
  due: boolean;
  overdueDays: number;
  reviewOff: boolean;
  /** Design problems that use this concept/pattern, and how many of them were practised. */
  linkedProblems: number;
  linkedPracticed: number;
  sessions: number;
  lastSessionConfidence: number | null;
  /** Debrief notes from interview sessions ("missing", "to revise"). */
  sessionNotes: string[];
  notes: string;
}

export interface SDExercise {
  key: string;
  title: string;
  href: string;
  track: "hld" | "lld";
  why: string;
}

export interface SDRecommendation {
  module: "sd";
  key: string;
  title: string;
  kind: SDFacts["kind"];
  track: "hld" | "lld";
  href: string;
  action: SDAction;
  priority: number;
  level: PriorityLevel;
  signals: Signal[];
  reasons: string[];
  exercises: SDExercise[];
  stopSolving: boolean;
  facts: SDFacts;
}

/* ---------- plan ---------- */

export interface PlanStep {
  id: string;
  kind: "review" | "solve" | "variation" | "explain" | "revise" | "study" | "design" | "interview" | "guided";
  label: string;
  detail?: string;
  minutes: number;
  href?: string;
  slug?: string;
  sdKey?: string;
}

export interface ModulePlan {
  module: CoachCtx;
  minutes: number;
  focusTitle: string;
  actionLabel: string;
  priority: number | null;
  level: PriorityLevel | null;
  signals: Signal[];
  why: string[];
  steps: PlanStep[];
  after?: { title: string; reason: string; href: string };
  avoid: string[];
  stopMessage?: string;
}

export interface CoachPlan {
  date: string;
  generatedAt: string;
  prefs: CoachPrefs;
  interviewDaysLeft: number | null;
  dsa: ModulePlan | null;
  sd: ModulePlan | null;
}

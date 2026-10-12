import { z } from "zod";

/** Validation for everything the client sends. Mirrors the types in lib/progress.ts. */

const text = (max = 50_000) => z.string().max(max);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const iso = z.string().max(40);
const slug = z.string().min(1).max(200);

export const HistoryItemSchema = z.object({
  date: day,
  at: iso.optional(),
  kind: z.enum(["solve", "revisit"]),
  confidence: z.number().int().min(0).max(5),
  result: z.enum(["solved", "hints", "failed", "reviewed"]).optional(),
  durationSec: z.number().int().min(0).max(86_400).optional(),
  note: text(5_000).optional(),
});

export const EntrySchema = z.object({
  status: z.enum(["todo", "attempted", "solved", "mastered"]),
  understanding: z.number().int().min(0).max(5),
  revisit: z.boolean(),
  revisionNote: text(5_000).optional(),
  starred: z.boolean(),
  statement: text(),
  approach: text(),
  insight: text(5_000),
  mistakes: text(),
  notes: text(),
  code: text(100_000),
  language: text(40),
  time: text(200),
  space: text(200),
  solveCount: z.number().int().min(0),
  revisitCount: z.number().int().min(0),
  failCount: z.number().int().min(0),
  history: z.array(HistoryItemSchema).max(1_000),
  solvedAt: iso.optional(),
  lastAttemptAt: iso.optional(),
  nextReview: day.optional(),
  updatedAt: iso,
});

export const PatternEntrySchema = z.object({
  status: z.enum(["unrated", "learning", "understood", "needs-practice"]),
  note: text(),
});

export const CustomProblemSchema = z.object({
  slug: z.string().regex(/^custom-[a-z0-9]+$/),
  title: text(300),
  url: text(2_000),
  platform: text(60),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  patternId: text(100),
  takeaway: text(1_000),
  createdAt: iso,
});

export const CompanySchema = z.object({
  id: text(64),
  name: text(120),
  notes: text(),
  slugs: z.array(slug).max(2_000),
  createdAt: iso,
});

export const MockSchema = z.object({
  id: text(64),
  date: day,
  title: text(200),
  minutes: z.number().int().min(0).max(1_000),
  rating: z.number().int().min(0).max(5),
  notes: text(10_000),
});

export const EventSchema = z.object({
  id: text(64),
  at: iso,
  type: z.enum([
    "solved", "reviewed", "failed", "mastered", "note", "pattern", "flagged", "mock",
    "sd-studied", "sd-reviewed", "sd-practiced", "sd-mastered", "sd-note", "sd-session",
  ]),
  slug: slug.optional(),
  patternId: text(100).optional(),
  sdKey: text(200).optional(),
  text: text(500),
});

export const PlanTaskSchema = z.object({
  id: text(250),
  kind: z.enum(["new", "pattern", "failed", "theory", "hld", "lld"]),
  label: text(100),
  slug: slug.optional(),
  patternId: text(100).optional(),
  sdKey: text(200).optional(),
});

export const SettingsSchema = z.object({
  name: text(80),
  dailyNew: z.number().int().min(1).max(10),
  mockTarget: z.number().int().min(1).max(100),
  sidebarCollapsed: z.boolean(),
  navCollapsed: z.record(text(40), z.boolean()).optional(),
  includeSD: z.boolean().optional(),
  sdAutoReview: z.boolean().optional(),
});

export const MetaSchema = z
  .object({
    daily: z.record(day, z.record(text(250), z.boolean())),
    plans: z.record(day, z.array(PlanTaskSchema).max(20)),
    checklist: z.record(text(64), z.boolean()),
    settings: SettingsSchema,
  })
  .partial();

/* ---------- System Design ---------- */

const MAX_WORKSPACE_BYTES = 400_000;

export const SDHistoryItemSchema = z.object({
  date: day,
  at: iso,
  kind: z.enum(["study", "review", "practice", "session"]),
  rating: z.number().int().min(1).max(5),
  durationSec: z.number().int().min(0).max(86_400).optional(),
  note: text(5_000).optional(),
});

export const SDEntrySchema = z.object({
  status: z.enum(["todo", "learning", "done", "mastered"]),
  confidence: z.number().int().min(0).max(5),
  starred: z.boolean(),
  notes: text(),
  reviewCount: z.number().int().min(0),
  lastReviewed: iso.optional(),
  nextReview: day.optional(),
  history: z.array(SDHistoryItemSchema).max(200),
  // Free-form workspace document (requirements, APIs, classes…); bounded by size.
  workspace: z
    .record(z.string().max(100), z.unknown())
    .refine((w) => JSON.stringify(w).length <= MAX_WORKSPACE_BYTES, "Workspace too large")
    .optional(),
  reviewOff: z.boolean().optional(),
  revisit: z.boolean().optional(),
  revisionNote: text(5_000).optional(),
  updatedAt: iso,
});

const coord = z.number().min(-10_000).max(20_000);

export const DiagramSchema = z.object({
  id: text(64),
  title: text(200),
  problemKey: text(200).optional(),
  notes: text(),
  nodes: z
    .array(z.object({ id: text(64), type: text(40), label: text(120), x: coord, y: coord, note: text(2_000).optional() }))
    .max(300),
  edges: z.array(z.object({ id: text(64), from: text(64), to: text(64), label: text(120).optional() })).max(600),
  createdAt: iso,
  updatedAt: iso,
});

export const SDCustomSchema = z.object({
  id: z.string().regex(/^sdc-[a-z0-9]+$/),
  track: z.enum(["hld", "lld"]),
  title: text(300),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  statement: text(10_000),
  createdAt: iso,
});

export const SDSessionSchema = z.object({
  id: text(64),
  mode: z.enum(["hld", "lld", "mixed"]),
  itemKey: text(200),
  title: text(300),
  startedAt: iso,
  plannedMin: z.number().int().min(1).max(600),
  durationSec: z.number().int().min(0).max(86_400),
  phases: z.record(text(64), z.boolean()),
  wentWell: text(10_000),
  difficult: text(10_000),
  missing: text(10_000),
  toRevise: text(10_000),
  confidence: z.number().int().min(0).max(5),
});

/** A change set: maps hold upserts (null = delete); arrays replace the whole collection. */
export const PatchSchema = z.object({
  problems: z.record(slug, EntrySchema.nullable()).optional(),
  patterns: z.record(text(100), PatternEntrySchema.nullable()).optional(),
  custom: z.array(CustomProblemSchema).max(2_000).optional(),
  companies: z.array(CompanySchema).max(200).optional(),
  mocks: z.array(MockSchema).max(2_000).optional(),
  events: z.array(EventSchema).max(300).optional(),
  meta: MetaSchema.optional(),
  sd: z.record(text(200), SDEntrySchema.nullable()).optional(),
  diagrams: z.record(text(64), DiagramSchema.nullable()).optional(),
  sdCustom: z.array(SDCustomSchema).max(2_000).optional(),
  sdSessions: z.array(SDSessionSchema).max(500).optional(),
});

export type Patch = z.infer<typeof PatchSchema>;

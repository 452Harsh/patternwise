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
  type: z.enum(["solved", "reviewed", "failed", "mastered", "note", "pattern", "flagged", "mock"]),
  slug: slug.optional(),
  patternId: text(100).optional(),
  text: text(500),
});

export const PlanTaskSchema = z.object({
  id: text(250),
  kind: z.enum(["new", "pattern", "failed", "theory"]),
  label: text(100),
  slug: slug.optional(),
  patternId: text(100).optional(),
});

export const SettingsSchema = z.object({
  name: text(80),
  dailyNew: z.number().int().min(1).max(10),
  mockTarget: z.number().int().min(1).max(100),
  sidebarCollapsed: z.boolean(),
});

export const MetaSchema = z
  .object({
    daily: z.record(day, z.record(text(250), z.boolean())),
    plans: z.record(day, z.array(PlanTaskSchema).max(20)),
    checklist: z.record(text(64), z.boolean()),
    settings: SettingsSchema,
  })
  .partial();

/** A change set: maps hold upserts (null = delete); arrays replace the whole collection. */
export const PatchSchema = z.object({
  problems: z.record(slug, EntrySchema.nullable()).optional(),
  patterns: z.record(text(100), PatternEntrySchema.nullable()).optional(),
  custom: z.array(CustomProblemSchema).max(2_000).optional(),
  companies: z.array(CompanySchema).max(200).optional(),
  mocks: z.array(MockSchema).max(2_000).optional(),
  events: z.array(EventSchema).max(300).optional(),
  meta: MetaSchema.optional(),
});

export type Patch = z.infer<typeof PatchSchema>;

import type { Difficulty } from "../types";
import { HLD_CATEGORY_LIST, HLD_CONCEPTS } from "./hld-concepts";
import { HLD_PATTERNS } from "./hld-patterns";
import { HLD_PROBLEMS } from "./hld-problems";
import { LLD_CATEGORY_LIST, LLD_CONCEPTS } from "./lld-concepts";
import { LLD_PATTERNS } from "./lld-patterns";
import { LLD_PROBLEMS } from "./lld-problems";
import type { HLDPattern, HLDProblem, LLDPattern, LLDProblem, SDCategory, SDConcept, SDTrack } from "./types";

export { HLD_CATEGORY_LIST, HLD_CONCEPTS, HLD_PATTERNS, HLD_PROBLEMS, LLD_CATEGORY_LIST, LLD_CONCEPTS, LLD_PATTERNS, LLD_PROBLEMS };

export type SDKind = "concept" | "pattern" | "problem" | "diagram";

/** One row in the System Design catalog. `key` identifies the item in progress, revision and notes. */
export interface SDItem {
  key: string;
  kind: SDKind;
  id: string;
  track: SDTrack;
  title: string;
  /** Category / pattern family / "Problem" — used for grouping. */
  group: string;
  href: string;
  difficulty?: Difficulty;
  summary: string;
}

export const sdKey = (kind: SDKind, id: string) => `${kind}:${id}`;

export const SD_CATEGORIES: SDCategory[] = [...HLD_CATEGORY_LIST, ...LLD_CATEGORY_LIST];
const categoryName = new Map(SD_CATEGORIES.map((c) => [c.id, c.name]));

export const ALL_CONCEPTS: SDConcept[] = [...HLD_CONCEPTS, ...LLD_CONCEPTS];

const LLD_FAMILY = { creational: "Creational", structural: "Structural", behavioral: "Behavioral" } as const;

export const SD_ITEMS: SDItem[] = [
  ...ALL_CONCEPTS.map((c) => ({
    key: sdKey("concept", c.id),
    kind: "concept" as const,
    id: c.id,
    track: c.track,
    title: c.name,
    group: categoryName.get(c.category) ?? c.category,
    href: `/system-design/concepts/${c.id}`,
    summary: c.summary,
  })),
  ...HLD_PATTERNS.map((p) => ({
    key: sdKey("pattern", p.id),
    kind: "pattern" as const,
    id: p.id,
    track: "hld" as const,
    title: p.name,
    group: "Architecture pattern",
    href: `/system-design/patterns/${p.id}`,
    summary: p.summary,
  })),
  ...LLD_PATTERNS.map((p) => ({
    key: sdKey("pattern", p.id),
    kind: "pattern" as const,
    id: p.id,
    track: "lld" as const,
    title: p.name,
    group: LLD_FAMILY[p.category],
    href: `/system-design/patterns/${p.id}`,
    summary: p.intent,
  })),
  ...HLD_PROBLEMS.map((p) => ({
    key: sdKey("problem", p.id),
    kind: "problem" as const,
    id: p.id,
    track: "hld" as const,
    title: p.title,
    group: "HLD problem",
    href: `/system-design/problems/${p.id}`,
    difficulty: p.difficulty,
    summary: p.statement,
  })),
  ...LLD_PROBLEMS.map((p) => ({
    key: sdKey("problem", p.id),
    kind: "problem" as const,
    id: p.id,
    track: "lld" as const,
    title: p.title,
    group: "LLD problem",
    href: `/system-design/problems/${p.id}`,
    difficulty: p.difficulty,
    summary: p.statement,
  })),
];

export const SD_INDEX = new Map(SD_ITEMS.map((x) => [x.key, x]));

export const conceptById = new Map(ALL_CONCEPTS.map((c) => [c.id, c]));
export const hldPatternById = new Map(HLD_PATTERNS.map((p) => [p.id, p]));
export const lldPatternById = new Map(LLD_PATTERNS.map((p) => [p.id, p]));
export const hldProblemById = new Map(HLD_PROBLEMS.map((p) => [p.id, p]));
export const lldProblemById = new Map(LLD_PROBLEMS.map((p) => [p.id, p]));

export type AnyPattern = { track: "hld"; pattern: HLDPattern } | { track: "lld"; pattern: LLDPattern };
export type AnyProblem = { track: "hld"; problem: HLDProblem } | { track: "lld"; problem: LLDProblem };

export function findPattern(id: string): AnyPattern | undefined {
  const h = hldPatternById.get(id);
  if (h) return { track: "hld", pattern: h };
  const l = lldPatternById.get(id);
  return l ? { track: "lld", pattern: l } : undefined;
}

export function findProblem(id: string): AnyProblem | undefined {
  const h = hldProblemById.get(id);
  if (h) return { track: "hld", problem: h };
  const l = lldProblemById.get(id);
  return l ? { track: "lld", problem: l } : undefined;
}

export const categoriesFor = (track: SDTrack) => SD_CATEGORIES.filter((c) => c.track === track);
export const conceptsIn = (categoryId: string) => ALL_CONCEPTS.filter((c) => c.category === categoryId);

/** URL for any catalog key, including custom problems and diagrams not in SD_ITEMS. */
export function sdHref(key: string): string {
  const [kind, ...rest] = key.split(":");
  const id = rest.join(":");
  if (kind === "concept") return `/system-design/concepts/${id}`;
  if (kind === "pattern") return `/system-design/patterns/${id}`;
  if (kind === "problem") return `/system-design/problems/${id}`;
  if (kind === "diagram") return `/system-design/architecture/${id}`;
  return "/system-design";
}

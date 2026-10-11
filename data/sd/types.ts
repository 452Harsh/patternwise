import type { Difficulty } from "../types";

/** System Design curriculum types. Content lives in the sibling data files. */

export type SDTrack = "hld" | "lld";

export type ComponentType =
  | "client"
  | "load-balancer"
  | "api-gateway"
  | "service"
  | "database"
  | "cache"
  | "queue"
  | "worker"
  | "cdn"
  | "storage"
  | "search"
  | "notification"
  | "dns"
  | "external";

/** A small left-to-right flow used for visual explanations (auto-laid out). */
export interface FlowSpec {
  nodes: { id: string; label: string; type?: ComponentType }[];
  edges: { from: string; to: string; label?: string }[];
}

export interface SDCategory {
  id: string;
  track: SDTrack;
  name: string;
  blurb: string;
}

export interface SDConcept {
  id: string;
  track: SDTrack;
  /** SDCategory id */
  category: string;
  name: string;
  /** What is it? 1–3 sentences. */
  summary: string;
  /** Why do we use it? The problem it solves. */
  why: string;
  /** When should I use it? Practical scenarios. */
  whenToUse: string[];
  /** How does it work? Ordered steps. */
  howItWorks: string[];
  /** Optional visual explanation. */
  flow?: FlowSpec;
  pros: string[];
  cons: string[];
  interviewQuestions: string[];
  /** Related concept ids (same or other track). */
  related: string[];
  /** LLD concepts: a short illustrative snippet. */
  example?: { language: "java" | "python" | "typescript" | "cpp"; code: string };
}

export interface HLDPattern {
  id: string;
  name: string;
  summary: string;
  problem: string;
  whenToUse: string[];
  whenNotToUse: string[];
  diagram: FlowSpec;
  advantages: string[];
  disadvantages: string[];
  tradeoffs: string[];
  /** HLD concept ids */
  concepts: string[];
  /** HLD problem ids */
  problems: string[];
}

export type UMLRelation = "inheritance" | "realization" | "composition" | "aggregation" | "association" | "dependency";

export interface UMLClass {
  name: string;
  kind: "class" | "interface" | "abstract";
  attributes: string[];
  methods: string[];
}

export interface UMLSpec {
  classes: UMLClass[];
  relations: { from: string; to: string; type: UMLRelation; label?: string }[];
}

export type LLDPatternCategory = "creational" | "structural" | "behavioral";

export interface LLDPattern {
  id: string;
  name: string;
  category: LLDPatternCategory;
  intent: string;
  problem: string;
  whenToUse: string[];
  whenNotToUse: string[];
  uml: UMLSpec;
  /** A real-world analogy or usage example in one or two sentences. */
  example: string;
  advantages: string[];
  disadvantages: string[];
  code: { python: string };
  /** LLD pattern ids */
  related: string[];
  /** LLD problem ids */
  problems: string[];
}

export interface CapacityDefaults {
  dau: number;
  readsPerUser: number;
  writesPerUser: number;
  objectSizeKB: number;
  retentionYears: number;
  peakFactor: number;
}

export interface HLDProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  statement: string;
  functional: string[];
  nonFunctional: string[];
  capacity: CapacityDefaults;
  /** Key building blocks a good answer usually touches (hints, hidden by default). */
  components: string[];
  deepDives: string[];
  /** HLD concept ids */
  concepts: string[];
  /** HLD pattern ids */
  patterns: string[];
}

export interface LLDProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  statement: string;
  functional: string[];
  actors: string[];
  /** Candidate core entities (hints). */
  entities: string[];
  /** LLD pattern ids that commonly fit */
  patterns: string[];
  extensions: string[];
  /** LLD concept ids */
  concepts: string[];
}

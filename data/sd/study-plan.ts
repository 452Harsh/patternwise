import type { SDKind } from "./index";

export interface SDPhase {
  id: string;
  name: string;
  summary: string;
  /** Concept categories covered in this phase. */
  categories: string[];
  /** Whole item kinds covered in this phase (e.g. every pattern). */
  kinds?: SDKind[];
}

/** System Design roadmap. HLD and LLD advance side by side in each phase. */
export const SD_PHASES: SDPhase[] = [
  { id: "foundations", name: "Foundations", summary: "Core distributed-systems ideas and object-oriented basics.", categories: ["core", "oop"] },
  { id: "building-blocks", name: "Building Blocks", summary: "Infrastructure, databases and caching; SOLID and design principles.", categories: ["infrastructure", "databases", "caching", "principles"] },
  { id: "async-reliability", name: "Async & Reliability", summary: "Messaging, resilience and observability; UML and class design.", categories: ["messaging", "reliability", "observability", "uml-design"] },
  { id: "patterns", name: "Patterns", summary: "Architecture patterns for HLD and GoF design patterns for LLD.", categories: [], kinds: ["pattern"] },
  { id: "practice", name: "Practice & Interviews", summary: "End-to-end HLD and LLD problems, then timed interview sessions.", categories: [], kinds: ["problem"] },
];

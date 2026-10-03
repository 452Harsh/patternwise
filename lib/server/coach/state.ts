import "server-only";
import type { Entry, SDEntry, State } from "@/lib/progress";
import { loadState } from "../repo";

/** The user's progress as the coach sees it: read from MongoDB, never from the request body. */
export type ServerState = State;

export const blankEntryLike = (): Entry => ({
  status: "todo",
  understanding: 0,
  revisit: false,
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
  solveCount: 0,
  revisitCount: 0,
  failCount: 0,
  history: [],
  updatedAt: "",
});

const blankSDLike = (): SDEntry => ({ status: "todo", confidence: 0, starred: false, notes: "", reviewCount: 0, history: [], updatedAt: "" });

export async function loadUserState(): Promise<ServerState> {
  const { state: raw } = await loadState();
  const s = raw as unknown as Partial<State>;
  return {
    problems: Object.fromEntries(Object.entries(s.problems ?? {}).map(([k, e]) => [k, { ...blankEntryLike(), ...e }])),
    patterns: s.patterns ?? {},
    custom: s.custom ?? [],
    companies: s.companies ?? [],
    mocks: s.mocks ?? [],
    events: s.events ?? [],
    daily: s.daily ?? {},
    plans: s.plans ?? {},
    checklist: s.checklist ?? {},
    settings: { name: "", dailyNew: 2, mockTarget: 10, sidebarCollapsed: false, navCollapsed: {}, includeSD: true, sdAutoReview: true, ...s.settings },
    sd: Object.fromEntries(Object.entries(s.sd ?? {}).map(([k, e]) => [k, { ...blankSDLike(), ...e }])),
    sdCustom: s.sdCustom ?? [],
    diagrams: s.diagrams ?? {},
    sdSessions: s.sdSessions ?? [],
  };
}

"use client";

import { useSyncExternalStore } from "react";
import type { Difficulty } from "@/data/types";

/* ---------- types ---------- */

export type Status = "todo" | "attempted" | "solved" | "mastered";
export type PatternStatus = "unrated" | "learning" | "understood" | "needs-practice";
export type LogKind = "solve" | "revisit";
export type AttemptResult = "solved" | "hints" | "failed" | "reviewed";

export interface HistoryItem {
  /** yyyy-mm-dd, local */
  date: string;
  /** ISO timestamp */
  at?: string;
  kind: LogKind;
  confidence: number;
  result?: AttemptResult;
  durationSec?: number;
  note?: string;
}

export interface Entry {
  status: Status;
  /** 0 = unrated, 1 = lost, 5 = could teach it. Updated on every logged attempt. */
  understanding: number;
  /** Manually added to the revision queue. */
  revisit: boolean;
  starred: boolean;
  /** The problem restated in my own words. */
  statement: string;
  /** How I recognised the pattern + step-by-step approach. */
  approach: string;
  insight: string;
  mistakes: string;
  notes: string;
  code: string;
  language: string;
  time: string;
  space: string;
  solveCount: number;
  revisitCount: number;
  failCount: number;
  history: HistoryItem[];
  solvedAt?: string;
  lastAttemptAt?: string;
  /** yyyy-mm-dd, local. */
  nextReview?: string;
  updatedAt: string;
}

export interface PatternEntry {
  status: PatternStatus;
  note: string;
}

export interface CustomProblem {
  slug: string;
  title: string;
  url: string;
  platform: string;
  difficulty: Difficulty;
  patternId: string;
  takeaway: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  notes: string;
  slugs: string[];
  createdAt: string;
}

export interface Mock {
  id: string;
  date: string;
  title: string;
  minutes: number;
  rating: number;
  notes: string;
}

export type EventType = "solved" | "reviewed" | "failed" | "mastered" | "note" | "pattern" | "flagged" | "mock";

export interface ActivityEvent {
  id: string;
  at: string;
  type: EventType;
  slug?: string;
  patternId?: string;
  text: string;
}

export interface Settings {
  name: string;
  dailyNew: number;
  mockTarget: number;
  sidebarCollapsed: boolean;
}

export interface State {
  problems: Record<string, Entry>;
  patterns: Record<string, PatternEntry>;
  custom: CustomProblem[];
  companies: Company[];
  mocks: Mock[];
  events: ActivityEvent[];
  /** date → task id → done */
  daily: Record<string, Record<string, boolean>>;
  /** date → generated daily plan (persisted so it doesn't reshuffle during the day) */
  plans: Record<string, PlanTask[]>;
  /** Interview revision checklist: item id → done */
  checklist: Record<string, boolean>;
  settings: Settings;
}

export interface PlanTask {
  id: string;
  kind: "new" | "pattern" | "failed" | "theory";
  label: string;
  slug?: string;
  patternId?: string;
}

export type ProgressMap = State["problems"];

/* ---------- defaults ---------- */

const KEY = "dsa-tracker:v2";
/** Set while the local copy has changes the server hasn't confirmed (survives reloads). */
const DIRTY_KEY = "dsa-tracker:dirty";
const LEGACY_KEY = "dsa-tracker:v1";
const MAX_EVENTS = 300;

export const DEFAULT_SETTINGS: Settings = { name: "", dailyNew: 2, mockTarget: 10, sidebarCollapsed: false };

const EMPTY: State = {
  problems: {},
  patterns: {},
  custom: [],
  companies: [],
  mocks: [],
  events: [],
  daily: {},
  plans: {},
  checklist: {},
  settings: DEFAULT_SETTINGS,
};

export const blankEntry = (): Entry => ({
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
  updatedAt: new Date(0).toISOString(),
});

export const blankPattern = (): PatternEntry => ({ status: "unrated", note: "" });

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/* ---------- dates ---------- */

export const today = () => new Date().toLocaleDateString("en-CA");

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

export function daysBetween(from: string, to: string): number {
  const ms = new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

/** Days until the next review, by confidence (1–5). Grows with each successful revisit. */
const BASE_INTERVAL = [1, 1, 3, 7, 14, 30];
export const reviewInterval = (confidence: number, revisitCount: number) =>
  Math.max(1, Math.round(BASE_INTERVAL[confidence] * (1 + 0.5 * revisitCount)));

/* ---------- persistence ---------- */

let raw: string | null = null;
let cache: State = EMPTY;
let checkedLegacy = false;
const listeners = new Set<() => void>();

function normalize(src: Partial<State>): State {
  const problems: State["problems"] = {};
  for (const [slug, e] of Object.entries(src.problems ?? {})) problems[slug] = { ...blankEntry(), ...e };
  const patterns: State["patterns"] = {};
  for (const [id, e] of Object.entries(src.patterns ?? {})) patterns[id] = { ...blankPattern(), ...e };
  return {
    problems,
    patterns,
    custom: src.custom ?? [],
    companies: src.companies ?? [],
    mocks: src.mocks ?? [],
    events: src.events ?? [],
    daily: src.daily ?? {},
    plans: src.plans ?? {},
    checklist: src.checklist ?? {},
    settings: { ...DEFAULT_SETTINGS, ...src.settings },
  };
}

function migrateLegacy(): State | null {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return null;
    const old = JSON.parse(legacy) as Record<string, Partial<Entry>>;
    const problems: State["problems"] = {};
    for (const [slug, e] of Object.entries(old)) {
      const solved = e.status === "solved";
      problems[slug] = {
        ...blankEntry(),
        ...e,
        solveCount: solved ? 1 : 0,
        history:
          solved && e.solvedAt
            ? [{ date: e.solvedAt.slice(0, 10), kind: "solve", confidence: e.understanding ?? 0, result: "solved" }]
            : [],
      };
    }
    return normalize({ problems });
  } catch {
    return null;
  }
}

function read(): State {
  let next: string | null;
  try {
    next = localStorage.getItem(KEY);
  } catch {
    return cache;
  }
  if (next === null && !checkedLegacy) {
    checkedLegacy = true;
    const migrated = migrateLegacy();
    if (migrated) {
      // Persist silently: read() runs during render, so it must not notify listeners.
      next = JSON.stringify(migrated);
      try {
        localStorage.setItem(KEY, next);
        localStorage.removeItem(LEGACY_KEY);
      } catch {}
      raw = next;
      cache = migrated;
      return cache;
    }
  }
  if (next === raw) return cache;
  raw = next;
  try {
    cache = next ? normalize(JSON.parse(next)) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function persistLocal(state: State) {
  const json = JSON.stringify(state);
  try {
    // After sign-out starts, never write the local copy back (e.g. a load that was still in flight).
    if (!signingOut) localStorage.setItem(KEY, json);
  } catch {
    // Storage unavailable: keep in-memory state so the UI still works this session.
  }
  raw = json;
  cache = state;
  listeners.forEach((l) => l());
}

function write(state: State) {
  persistLocal(state);
  if (lastSynced && !signingOut) {
    markDirty(true);
    scheduleSync(SAVE_DEBOUNCE_MS);
  }
}

function markDirty(dirty: boolean) {
  try {
    if (dirty) localStorage.setItem(DIRTY_KEY, "1");
    else localStorage.removeItem(DIRTY_KEY);
  } catch {}
}

const isDirty = () => {
  try {
    return localStorage.getItem(DIRTY_KEY) === "1";
  } catch {
    return false;
  }
};

/* ---------- server sync (MongoDB via /api/state) ---------- */

export type SyncStatus = "idle" | "loading" | "ready" | "saving" | "error" | "offline";

const SAVE_DEBOUNCE_MS = 700;
let status: SyncStatus = "idle";
let lastSynced: State | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let inflight = false;
let retryMs = 2_000;
let signingOut = false;
const statusListeners = new Set<() => void>();

function setStatus(next: SyncStatus) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((l) => l());
}

const subscribeStatus = (cb: () => void) => {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
};
export const useSyncStatus = () => useSyncExternalStore(subscribeStatus, () => status, () => "idle" as SyncStatus);

const hasData = (s: State) =>
  Object.keys(s.problems).length > 0 || Object.keys(s.patterns).length > 0 || s.custom.length > 0 || s.companies.length > 0 || s.mocks.length > 0;

function mapDiff<T>(prev: Record<string, T>, next: Record<string, T>): Record<string, T | null> | undefined {
  const out: Record<string, T | null> = {};
  for (const [k, v] of Object.entries(next)) if (prev[k] !== v) out[k] = v;
  for (const k of Object.keys(prev)) if (!(k in next)) out[k] = null;
  return Object.keys(out).length ? out : undefined;
}

/** Changes between two states. Mutations are immutable, so reference inequality = changed. */
function diff(prev: State, next: State) {
  const patch: Record<string, unknown> = {};
  const problems = mapDiff(prev.problems, next.problems);
  const patterns = mapDiff(prev.patterns, next.patterns);
  if (problems) patch.problems = problems;
  if (patterns) patch.patterns = patterns;
  for (const k of ["custom", "companies", "mocks", "events"] as const) if (prev[k] !== next[k]) patch[k] = next[k];
  const meta: Record<string, unknown> = {};
  for (const k of ["daily", "plans", "checklist", "settings"] as const) if (prev[k] !== next[k]) meta[k] = next[k];
  if (Object.keys(meta).length) patch.meta = meta;
  return Object.keys(patch).length ? patch : null;
}

function scheduleSync(delay: number) {
  clearTimeout(timer);
  timer = setTimeout(flush, delay);
}

// Full page loads on purpose: they discard all in-memory state when the session ends.
// eslint-disable-next-line @next/next/no-location-assign-relative-destination
const toLogin = () => window.location.assign(`/login?next=${encodeURIComponent(location.pathname)}`);

async function flush() {
  if (!lastSynced || inflight) return;
  const target = cache;
  const patch = diff(lastSynced, target);
  if (!patch) return setStatus("ready");
  inflight = true;
  setStatus("saving");
  try {
    const res = await fetch("/api/state", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.status === 401) return toLogin();
    if (!res.ok) throw new Error(`Save failed (${res.status})`);
    lastSynced = target;
    retryMs = 2_000;
    if (cache === target) markDirty(false);
    setStatus("ready");
  } catch {
    setStatus("error");
    retryMs = Math.min(retryMs * 2, 60_000);
    scheduleSync(retryMs);
  } finally {
    inflight = false;
    // More edits arrived while saving: send them too.
    if (status === "ready" && cache !== target) scheduleSync(150);
  }
}

/** Load from the server once per page load. Called by <SyncBoot/>. */
export async function initRemote() {
  if (status !== "idle" || signingOut) return;
  setStatus("loading");
  try {
    const res = await fetch("/api/state", { cache: "no-store" });
    if (res.status === 401) return toLogin();
    if (!res.ok) throw new Error(`Load failed (${res.status})`);
    const { empty, state } = (await res.json()) as { empty: boolean; state: Partial<State> };
    const local = read();
    if (empty && hasData(local)) {
      // First run against an empty database: upload what this browser already has.
      lastSynced = EMPTY;
      setStatus("ready");
      scheduleSync(0);
      return;
    }
    if (signingOut) return;
    const remote = normalize(state);
    lastSynced = remote;
    if (isDirty() && hasData(local)) {
      // The last session closed before its changes were confirmed: keep them and re-send.
      // Per-problem entries merge by updatedAt so newer edits from another device survive.
      const problems = { ...remote.problems };
      for (const [slug, e] of Object.entries(local.problems)) {
        const r = remote.problems[slug];
        if (!r || e.updatedAt > r.updatedAt) problems[slug] = e;
      }
      persistLocal({ ...local, problems });
      setStatus("ready");
      scheduleSync(0);
      return;
    }
    persistLocal(remote);
    setStatus("ready");
  } catch {
    // Server unreachable: keep working from the local copy and retry later.
    setStatus("offline");
    setTimeout(() => {
      setStatus("idle");
      initRemote();
    }, 15_000);
  }
}

if (typeof window !== "undefined") {
  // Best-effort save of unsent changes when the tab is closed or hidden.
  window.addEventListener("pagehide", () => {
    const patch = lastSynced && diff(lastSynced, cache);
    if (!patch) return;
    fetch("/api/state", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
      keepalive: true,
    }).catch(() => {});
  });
}

export async function logout() {
  clearTimeout(timer);
  await flush().catch(() => {});
  signingOut = true;
  clearTimeout(timer);
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
    localStorage.removeItem(DIRTY_KEY);
  } catch {}
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/login");
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export const useStore = (): State => useSyncExternalStore(subscribe, read, () => EMPTY);
export const useProgress = (): ProgressMap => useStore().problems;
export const usePatternProgress = (): State["patterns"] => useStore().patterns;

/** True once data is available: loaded from the server, or the local copy while offline. */
export const useHydrated = () => {
  const s = useSyncStatus();
  return s !== "idle" && s !== "loading";
};

/* ---------- mutations ---------- */

function withEvent(state: State, ev: Omit<ActivityEvent, "id" | "at">): State {
  const events = [{ ...ev, id: uid(), at: new Date().toISOString() }, ...state.events].slice(0, MAX_EVENTS);
  return { ...state, events };
}

const NOTE_FIELDS: (keyof Entry)[] = ["notes", "approach", "insight", "mistakes", "statement", "code"];
const NOTE_EVENT_GAP_MS = 10 * 60_000;

export function updateEntry(slug: string, patch: Partial<Entry>, title?: string) {
  let state = read();
  const prev = state.problems[slug] ?? blankEntry();
  const next: Entry = { ...prev, ...patch, updatedAt: new Date().toISOString() };
  if (patch.status === "solved" && prev.status === "todo") next.solvedAt = next.updatedAt;
  state = { ...state, problems: { ...state.problems, [slug]: next } };

  const name = title ?? slug;
  if (NOTE_FIELDS.some((f) => f in patch)) {
    const last = state.events.find((e) => e.slug === slug && e.type === "note");
    if (!last || Date.now() - new Date(last.at).getTime() > NOTE_EVENT_GAP_MS) {
      state = withEvent(state, { type: "note", slug, text: `Added notes to ${name}` });
    }
  }
  if (patch.revisit && !prev.revisit) state = withEvent(state, { type: "flagged", slug, text: `Added ${name} to revision` });
  write(state);
}

export interface AttemptInput {
  result: AttemptResult;
  confidence: number;
  durationSec?: number;
  note?: string;
  /** Count as a fresh solve rather than a revision even if solved before. */
  fresh?: boolean;
}

/** Record an attempt with a confidence rating and schedule the next review. */
export function logAttempt(slug: string, input: AttemptInput, title?: string) {
  let state = read();
  const prev = state.problems[slug] ?? blankEntry();
  const date = today();
  const now = new Date().toISOString();
  const failed = input.result === "failed";
  const kind: LogKind = prev.solveCount === 0 || input.fresh ? "solve" : "revisit";
  const solveCount = prev.solveCount + (kind === "solve" && !failed ? 1 : 0);
  const revisitCount = prev.revisitCount + (kind === "revisit" && !failed ? 1 : 0);
  const confidence = failed ? Math.min(input.confidence, 1) || 1 : input.confidence;

  let status: Status = prev.status;
  if (failed) status = prev.status === "todo" ? "attempted" : prev.status === "mastered" ? "solved" : prev.status;
  else {
    if (status === "todo" || status === "attempted") status = "solved";
    if (confidence >= 5 && revisitCount >= 2) status = "mastered";
    else if (confidence <= 2 && status === "mastered") status = "solved";
  }

  const next: Entry = {
    ...prev,
    status,
    understanding: confidence,
    solveCount,
    revisitCount,
    failCount: prev.failCount + (failed ? 1 : 0),
    revisit: failed ? true : false,
    solvedAt: failed ? prev.solvedAt : (prev.solvedAt ?? now),
    lastAttemptAt: now,
    nextReview: addDays(date, failed ? 1 : reviewInterval(confidence, revisitCount)),
    history: [
      ...prev.history,
      {
        date,
        at: now,
        kind,
        confidence,
        result: input.result,
        durationSec: input.durationSec,
        note: input.note?.trim() || undefined,
      },
    ],
    updatedAt: now,
  };
  state = { ...state, problems: { ...state.problems, [slug]: next } };

  const name = title ?? slug;
  if (failed) state = withEvent(state, { type: "failed", slug, text: `Couldn't solve ${name} yet` });
  else if (status === "mastered" && prev.status !== "mastered")
    state = withEvent(state, { type: "mastered", slug, text: `Mastered ${name}` });
  else if (kind === "revisit") state = withEvent(state, { type: "reviewed", slug, text: `Reviewed ${name}` });
  else state = withEvent(state, { type: "solved", slug, text: `Solved ${name}` });
  write(state);
}

export type QuickReview = "got-it" | "practice" | "forgot" | "later";

/** Spaced-repetition quick actions used by the revision queue. */
export function quickReview(slug: string, action: QuickReview, title?: string) {
  const prev = read().problems[slug] ?? blankEntry();
  if (action === "later") {
    updateEntry(slug, { nextReview: addDays(today(), 1) });
    return;
  }
  if (action === "forgot") return logAttempt(slug, { result: "failed", confidence: 1 }, title);
  if (action === "practice") return logAttempt(slug, { result: "hints", confidence: 2 }, title);
  return logAttempt(slug, { result: "solved", confidence: Math.max(4, Math.min(5, prev.understanding + 1)) }, title);
}

export function updatePattern(id: string, patch: Partial<PatternEntry>, name?: string) {
  let state = read();
  const prev = state.patterns[id] ?? blankPattern();
  state = { ...state, patterns: { ...state.patterns, [id]: { ...prev, ...patch } } };
  if (patch.status && patch.status !== prev.status) {
    const label = { unrated: "Reset", learning: "Started learning", understood: "Understood", "needs-practice": "Needs practice:" }[
      patch.status
    ];
    state = withEvent(state, { type: "pattern", patternId: id, text: `${label} ${name ?? id}` });
  }
  write(state);
}

export function addCustomProblem(p: Omit<CustomProblem, "slug" | "createdAt">): string {
  const state = read();
  const slug = `custom-${uid()}`;
  write({ ...state, custom: [...state.custom, { ...p, slug, createdAt: new Date().toISOString() }] });
  return slug;
}

export function removeCustomProblem(slug: string) {
  const state = read();
  const problems = { ...state.problems };
  delete problems[slug];
  write({
    ...state,
    problems,
    custom: state.custom.filter((c) => c.slug !== slug),
    companies: state.companies.map((c) => ({ ...c, slugs: c.slugs.filter((s) => s !== slug) })),
  });
}

export function addCompany(name: string): string {
  const state = read();
  const id = uid();
  write({ ...state, companies: [...state.companies, { id, name, notes: "", slugs: [], createdAt: new Date().toISOString() }] });
  return id;
}

export function updateCompany(id: string, patch: Partial<Omit<Company, "id">>) {
  const state = read();
  write({ ...state, companies: state.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
}

export function removeCompany(id: string) {
  const state = read();
  write({ ...state, companies: state.companies.filter((c) => c.id !== id) });
}

export function addMock(m: Omit<Mock, "id">) {
  const state = withEvent(read(), { type: "mock", text: `Mock interview: ${m.title}` });
  write({ ...state, mocks: [{ ...m, id: uid() }, ...state.mocks] });
}

export function removeMock(id: string) {
  const state = read();
  write({ ...state, mocks: state.mocks.filter((m) => m.id !== id) });
}

export function toggleDaily(date: string, task: string, done: boolean) {
  const state = read();
  write({ ...state, daily: { ...state.daily, [date]: { ...state.daily[date], [task]: done } } });
}

export function savePlan(date: string, tasks: PlanTask[]) {
  const state = read();
  if (state.plans[date]) return;
  // Keep only the last two weeks of plans.
  const plans = Object.fromEntries(Object.entries(state.plans).filter(([d]) => daysBetween(d, date) < 14));
  write({ ...state, plans: { ...plans, [date]: tasks } });
}

/** Overwrite a day's plan (used by "regenerate"). */
export function replacePlan(date: string, tasks: PlanTask[]) {
  const state = read();
  const daily = { ...state.daily };
  delete daily[date];
  write({ ...state, plans: { ...state.plans, [date]: tasks }, daily });
}

export function toggleChecklist(id: string, done: boolean) {
  const state = read();
  write({ ...state, checklist: { ...state.checklist, [id]: done } });
}

export function updateSettings(patch: Partial<Settings>) {
  const state = read();
  write({ ...state, settings: { ...state.settings, ...patch } });
}

/* ---------- backup ---------- */

export function exportJson(): string {
  return JSON.stringify({ version: 2, ...read() }, null, 2);
}

export function importJson(text: string): number {
  const parsed = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object");
  }
  // v2 exports have a `problems` key; v1 exports were the problem map itself.
  const state = normalize("problems" in parsed ? parsed : { problems: parsed });
  write(state);
  return Object.keys(state.problems).length;
}

export function resetAll() {
  write({ ...EMPTY, settings: read().settings });
}

/* ---------- derived ---------- */

export const isSolved = (e: Entry | undefined) => e?.status === "solved" || e?.status === "mastered";

/** Flagged by me, failed, or solved but still shaky. */
export function needsRevisit(e: Entry | undefined): boolean {
  if (!e) return false;
  if (e.revisit) return true;
  return isSolved(e) && e.understanding > 0 && e.understanding <= 2;
}

export function isDue(e: Entry | undefined): boolean {
  return !!e?.nextReview && e.status !== "todo" && e.nextReview <= today();
}

/** Display status, including the derived "Needs revision". */
export type DisplayStatus = "not-started" | "attempted" | "solved" | "needs-revision" | "mastered";

export function displayStatus(e: Entry | undefined): DisplayStatus {
  if (!e || e.status === "todo") return "not-started";
  if (e.status === "mastered") return "mastered";
  if (needsRevisit(e) || (e.failCount > 0 && e.status === "attempted")) return "needs-revision";
  return e.status === "attempted" ? "attempted" : "solved";
}

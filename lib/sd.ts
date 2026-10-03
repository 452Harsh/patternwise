"use client";

import { useMemo } from "react";
import { categoriesFor, conceptById, conceptsIn, sdKey, type SDItem } from "@/data/sd";
import { SD_PHASES } from "@/data/sd/study-plan";
import type { SDTrack } from "@/data/sd/types";
import { isSDDue, useStore, type SDEntry, type State } from "./progress";
import { sdItemsFor } from "./sd-items";

/* ---------- catalog incl. custom problems and diagrams ---------- */

// The pure catalog builder lives in lib/sd-items.ts so server code can use it.
export { sdItemsFor };

export function useSDItems(): SDItem[] {
  const state = useStore();
  return useMemo(() => sdItemsFor(state), [state]);
}

export function useSDItem(key: string): SDItem | undefined {
  return useSDItems().find((x) => x.key === key);
}

/* ---------- scoring ---------- */

/** 0–1 mastery for one SD item: untouched 0, then scaled by confidence; mastered = 1. */
export function sdScore(e: SDEntry | undefined): number {
  if (!e) return 0;
  if (e.status === "mastered") return 1;
  if (!e.history.length && e.status === "todo") return 0;
  return Math.min(0.95, 0.2 + 0.15 * e.confidence);
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export const isPracticed = (e: SDEntry | undefined) =>
  !!e && (e.status === "done" || e.status === "mastered" || e.history.some((h) => h.kind === "practice" || h.kind === "session"));

export const MASTERED_CONFIDENCE = 4;

export function trackStats(state: State, track: SDTrack) {
  const items = sdItemsFor(state).filter((x) => x.track === track && x.kind !== "diagram");
  const by = (kind: SDItem["kind"]) => items.filter((x) => x.kind === kind);
  const concepts = by("concept");
  const patterns = by("pattern");
  const problems = by("problem");
  const e = (x: SDItem) => state.sd[x.key];
  return {
    items,
    mastery: mean(items.map((x) => sdScore(e(x)))),
    concepts: { total: concepts.length, mastered: concepts.filter((x) => (e(x)?.confidence ?? 0) >= MASTERED_CONFIDENCE).length, started: concepts.filter((x) => e(x)?.history.length).length },
    patterns: { total: patterns.length, mastered: patterns.filter((x) => (e(x)?.confidence ?? 0) >= MASTERED_CONFIDENCE).length },
    problems: { total: problems.length, completed: problems.filter((x) => isPracticed(e(x))).length },
  };
}

export function categoryStats(state: State, track: SDTrack) {
  return categoriesFor(track).map((c) => {
    const keys = conceptsIn(c.id).map((x) => sdKey("concept", x.id));
    const scores = keys.map((k) => sdScore(state.sd[k]));
    const rated = keys.map((k) => state.sd[k]?.confidence ?? 0).filter((v) => v > 0);
    return {
      category: c,
      total: keys.length,
      mastery: mean(scores),
      started: keys.filter((k) => state.sd[k]?.history.length).length,
      avg: mean(rated),
      weak: rated.length > 0 && mean(rated) < 3,
    };
  });
}

export function sdOverview(state: State) {
  const hld = trackStats(state, "hld");
  const lld = trackStats(state, "lld");
  const all = sdItemsFor(state);
  const due = all.filter((x) => isSDDue(state.sd[x.key]));
  const weak = all
    .filter((x) => {
      const e = state.sd[x.key];
      return e && e.history.length > 0 && e.confidence > 0 && e.confidence <= 2;
    })
    .sort((a, b) => (state.sd[a.key].confidence ?? 0) - (state.sd[b.key].confidence ?? 0));
  const recent = all
    .filter((x) => state.sd[x.key] && state.sd[x.key].updatedAt > new Date(0).toISOString())
    .sort((a, b) => state.sd[b.key].updatedAt.localeCompare(state.sd[a.key].updatedAt));
  return {
    hld,
    lld,
    overall: mean([hld.mastery, lld.mastery]),
    conceptsMastered: hld.concepts.mastered + lld.concepts.mastered,
    conceptsTotal: hld.concepts.total + lld.concepts.total,
    problemsCompleted: hld.problems.completed + lld.problems.completed,
    problemsTotal: hld.problems.total + lld.problems.total,
    due,
    weak,
    recent,
  };
}

/* ---------- roadmap ---------- */

/** Items in each roadmap phase and how far along you are (mean mastery; practice share for problems). */
export function sdPhaseProgress(state: State) {
  const items = sdItemsFor(state).filter((x) => x.kind !== "diagram");
  return SD_PHASES.map((phase) => {
    const inPhase = items.filter(
      (x) => (x.kind === "concept" && phase.categories.includes(conceptById.get(x.id)?.category ?? "")) || phase.kinds?.includes(x.kind),
    );
    const value =
      phase.id === "practice"
        ? inPhase.filter((x) => isPracticed(state.sd[x.key])).length / Math.max(1, inPhase.length)
        : mean(inPhase.map((x) => sdScore(state.sd[x.key])));
    const started = inPhase.filter((x) => state.sd[x.key]?.history.length).length;
    return { phase, items: inPhase, value, started };
  });
}

export function currentSDPhase(state: State): number {
  const i = sdPhaseProgress(state).findIndex((p) => p.value < 0.6);
  return i === -1 ? SD_PHASES.length - 1 : i;
}

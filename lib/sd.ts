"use client";

import { useMemo } from "react";
import { SD_ITEMS, categoriesFor, conceptById, conceptsIn, sdKey, type SDItem } from "@/data/sd";
import { SD_PHASES } from "@/data/sd/study-plan";
import type { SDTrack } from "@/data/sd/types";
import { isSDDone, isSDDue, useStore, type SDEntry, type State } from "./progress";

/* ---------- catalog incl. custom problems and diagrams ---------- */

export function sdItemsFor(state: State): SDItem[] {
  const custom: SDItem[] = state.sdCustom.map((c) => ({
    key: sdKey("problem", c.id),
    kind: "problem",
    id: c.id,
    track: c.track,
    title: c.title,
    group: c.track === "hld" ? "HLD problem" : "LLD problem",
    href: `/system-design/problems/${c.id}`,
    difficulty: c.difficulty,
    summary: c.statement,
  }));
  const diagrams: SDItem[] = Object.values(state.diagrams).map((d) => ({
    key: sdKey("diagram", d.id),
    kind: "diagram",
    id: d.id,
    track: "hld",
    title: d.title,
    group: "Architecture diagram",
    href: `/system-design/architecture/${d.id}`,
    summary: d.notes || `${d.nodes.length} components · ${d.edges.length} connections`,
  }));
  return [...SD_ITEMS, ...custom, ...diagrams];
}

export function useSDItems(): SDItem[] {
  const state = useStore();
  return useMemo(() => sdItemsFor(state), [state]);
}

export function useSDItem(key: string): SDItem | undefined {
  return useSDItems().find((x) => x.key === key);
}

/* ---------- scoring ---------- */

/** 0–1 score for one SD item: completed 1, anything else 0 (same as DSA). */
export function sdScore(e: SDEntry | undefined): number {
  return isSDDone(e) ? 1 : 0;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export const isPracticed = (e: SDEntry | undefined) =>
  isSDDone(e) || !!e?.history.some((h) => h.kind === "practice" || h.kind === "session");

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
    concepts: { total: concepts.length, completed: concepts.filter((x) => isSDDone(e(x))).length },
    patterns: { total: patterns.length, completed: patterns.filter((x) => isSDDone(e(x))).length },
    problems: { total: problems.length, completed: problems.filter((x) => isPracticed(e(x))).length },
  };
}

export function categoryStats(state: State, track: SDTrack) {
  return categoriesFor(track).map((c) => {
    const keys = conceptsIn(c.id).map((x) => sdKey("concept", x.id));
    const scores = keys.map((k) => sdScore(state.sd[k]));
    return {
      category: c,
      total: keys.length,
      mastery: mean(scores),
      completed: keys.filter((k) => isSDDone(state.sd[k])).length,
      weak: keys.some((k) => state.sd[k]?.revisit),
    };
  });
}

export function sdOverview(state: State) {
  const hld = trackStats(state, "hld");
  const lld = trackStats(state, "lld");
  const all = sdItemsFor(state);
  const due = all.filter((x) => isSDDue(state.sd[x.key]));
  // Items I put in revision, soonest review first.
  const inRevision = all
    .filter((x) => state.sd[x.key]?.revisit)
    .sort((a, b) => (state.sd[a.key].nextReview ?? "9999").localeCompare(state.sd[b.key].nextReview ?? "9999"));
  const recent = all
    .filter((x) => state.sd[x.key] && state.sd[x.key].updatedAt > new Date(0).toISOString())
    .sort((a, b) => state.sd[b.key].updatedAt.localeCompare(state.sd[a.key].updatedAt));
  return {
    hld,
    lld,
    overall: mean([hld.mastery, lld.mastery]),
    conceptsCompleted: hld.concepts.completed + lld.concepts.completed,
    conceptsTotal: hld.concepts.total + lld.concepts.total,
    problemsCompleted: hld.problems.completed + lld.problems.completed,
    problemsTotal: hld.problems.total + lld.problems.total,
    due,
    inRevision,
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

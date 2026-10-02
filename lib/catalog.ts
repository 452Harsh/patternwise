"use client";

import { useMemo } from "react";
import { allProblems, patternIndex } from "@/data/curriculum";
import { lcUrl, type Pattern, type Problem, type Topic } from "@/data/types";
import { useStore, type CustomProblem } from "./progress";

export interface CatalogItem {
  problem: Problem;
  topic: Topic;
  pattern: Pattern;
  platform: string;
  url: string;
  custom: boolean;
}

export const curatedItems: CatalogItem[] = allProblems.map((x) => ({
  ...x,
  platform: "LeetCode",
  url: lcUrl(x.problem.slug),
  custom: false,
}));

const curatedBySlug = new Map(curatedItems.map((x) => [x.problem.slug, x]));

export function customToItem(c: CustomProblem): CatalogItem | undefined {
  const meta = patternIndex.get(c.patternId);
  if (!meta) return undefined;
  return {
    problem: { slug: c.slug, title: c.title, difficulty: c.difficulty, takeaway: c.takeaway },
    topic: meta.topic,
    pattern: meta.pattern,
    platform: c.platform || "Other",
    url: c.url,
    custom: true,
  };
}

/** Curated problems followed by the user's own additions. */
export function useCatalog(): CatalogItem[] {
  const custom = useStore().custom;
  return useMemo(
    () => [...curatedItems, ...custom.map(customToItem).filter((x): x is CatalogItem => !!x)],
    [custom],
  );
}

export function useCatalogItem(slug: string): CatalogItem | undefined {
  const custom = useStore().custom;
  return useMemo(() => {
    const curated = curatedBySlug.get(slug);
    if (curated) return curated;
    const c = custom.find((x) => x.slug === slug);
    return c ? customToItem(c) : undefined;
  }, [slug, custom]);
}

export const getCuratedItem = (slug: string) => curatedBySlug.get(slug);

import type { Pattern, Problem, Topic } from "./types";
import { arraysHashing, twoPointers, slidingWindow, stack } from "./topics-1";
import { binarySearch, linkedList, trees, heap } from "./topics-2";
import { backtracking, graphs, dp, greedyIntervals, triesBits } from "./topics-3";
import {
  strings,
  prefixSum,
  sorting,
  matrix,
  monotonicExtras,
  stackQueueExtras,
  arraysExtras,
  twoPointersExtras,
  slidingExtras,
  bsExtras,
  linkedListExtras,
} from "./topics-4";
import {
  treeExtras,
  bst,
  recursionExtras,
  graphExtras,
  topoExtras,
  ufExtras,
  spExtras,
  advancedGraphs,
  dpExtras,
  greedyExtras,
  intervalsExtras,
  trieExtras,
  bitExtras,
  math,
  advancedDS,
} from "./topics-5";

const pick = (t: Topic, ...ids: string[]): Pattern[] =>
  ids.map((id) => {
    const p = t.patterns.find((x) => x.id === id);
    if (!p) throw new Error(`Pattern ${id} not found in ${t.id}`);
    return p;
  });

const omit = (t: Topic, ...ids: string[]): Pattern[] =>
  t.patterns.filter((p) => !ids.includes(p.id));

/** Order = suggested study order. */
export const topics: Topic[] = [
  { ...arraysHashing, patterns: [...omit(arraysHashing, "prefix-sum-hashmap"), ...arraysExtras] },
  strings,
  prefixSum,
  matrix,
  { ...twoPointers, patterns: [...twoPointers.patterns, ...twoPointersExtras] },
  { ...slidingWindow, patterns: [...omit(slidingWindow, "monotonic-deque"), ...slidingExtras] },
  sorting,
  { ...binarySearch, patterns: [...binarySearch.patterns, ...bsExtras] },
  { ...linkedList, patterns: [...linkedList.patterns, ...linkedListExtras] },
  {
    ...stack,
    id: "stack-queue",
    name: "Stacks & Queues",
    blurb: "LIFO for nesting and undo, FIFO for simulation and BFS. Includes classic design questions.",
    patterns: [...omit(stack, "monotonic-stack"), ...stackQueueExtras],
  },
  {
    id: "monotonic",
    name: "Monotonic Stack & Queue",
    blurb: "Keep candidates in sorted order so the best one is always at the end you read from. Each element enters and leaves once: O(n).",
    patterns: [
      ...pick(stack, "monotonic-stack"),
      monotonicExtras[0],
      monotonicExtras[1],
      ...pick(slidingWindow, "monotonic-deque"),
      monotonicExtras[2],
    ],
  },
  { ...backtracking, patterns: [...recursionExtras.slice(0, 1), ...backtracking.patterns, ...recursionExtras.slice(1)] },
  { ...trees, name: "Trees & Binary Trees", patterns: [...trees.patterns, ...treeExtras] },
  bst,
  heap,
  { ...graphs, name: "Graphs: BFS / DFS", patterns: [...omit(graphs, "topological-sort", "union-find", "shortest-path"), ...graphExtras] },
  {
    id: "topological-sort",
    name: "Topological Sort",
    blurb: "Order tasks that depend on each other, or detect that no valid order exists.",
    patterns: [...pick(graphs, "topological-sort"), ...topoExtras],
  },
  {
    id: "union-find",
    name: "Union Find / DSU",
    blurb: "Merge groups and ask 'are these connected?' in near-constant time.",
    patterns: [...pick(graphs, "union-find"), ...ufExtras],
  },
  {
    id: "shortest-path",
    name: "Shortest Path Algorithms",
    blurb: "BFS, Dijkstra, Bellman–Ford, Floyd–Warshall, 0-1 BFS: pick by edge weights and query shape.",
    patterns: [...pick(graphs, "shortest-path"), ...spExtras],
  },
  advancedGraphs,
  {
    id: "greedy",
    name: "Greedy",
    blurb: "Take the locally best choice and prove with an exchange argument that it never hurts.",
    patterns: [...pick(greedyIntervals, "greedy-choice"), ...greedyExtras],
  },
  {
    id: "intervals",
    name: "Intervals",
    blurb: "Sort, sweep, and track overlaps.",
    patterns: [...pick(greedyIntervals, "intervals"), ...intervalsExtras],
  },
  { ...dp, patterns: [...dp.patterns, ...dpExtras] },
  {
    id: "tries",
    name: "Tries",
    blurb: "Prefix trees for dictionaries, autocomplete and multi-word search.",
    patterns: [...pick(triesBits, "trie"), ...trieExtras],
  },
  {
    id: "bit-manipulation",
    name: "Bit Manipulation",
    blurb: "XOR, masks and shifts for O(1)-space tricks and subset enumeration.",
    patterns: [...pick(triesBits, "bits"), ...bitExtras],
  },
  math,
  advancedDS,
];

export const getTopic = (id: string) => topics.find((t) => t.id === id);

export const topicProblems = (t: Topic): Problem[] =>
  t.patterns.flatMap((p: Pattern) => p.problems);

export const allProblems = topics.flatMap((t) =>
  t.patterns.flatMap((p) =>
    p.problems.map((problem) => ({ problem, topic: t, pattern: p })),
  ),
);

export const problemIndex = new Map(allProblems.map((x) => [x.problem.slug, x]));

export const allPatterns = topics.flatMap((t) => t.patterns.map((pattern) => ({ pattern, topic: t })));

export const patternIndex = new Map(allPatterns.map((x) => [x.pattern.id, x]));

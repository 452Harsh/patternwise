export interface Phase {
  id: string;
  name: string;
  summary: string;
  topicIds: string[];
}

/** Topics in each phase, in study order. Phase 5 is revision-only (no new topics). */
export const PHASES: Phase[] = [
  {
    id: "fundamentals",
    name: "Fundamentals",
    summary: "Arrays, strings, hashing, prefix sums, matrices and linked lists.",
    topicIds: ["arrays-hashing", "strings", "prefix-sum", "matrix", "linked-list"],
  },
  {
    id: "core-patterns",
    name: "Core Patterns",
    summary: "Two pointers, sliding window, sorting, binary search, stacks, queues, monotonic structures, heaps.",
    topicIds: ["two-pointers", "sliding-window", "sorting", "binary-search", "stack-queue", "monotonic", "heap"],
  },
  {
    id: "trees-graphs",
    name: "Trees & Graphs",
    summary: "Binary trees, BSTs, BFS/DFS, topological sort and shortest paths.",
    topicIds: ["trees", "bst", "graphs", "topological-sort", "shortest-path"],
  },
  {
    id: "advanced",
    name: "Advanced Patterns",
    summary: "Greedy, intervals, backtracking, dynamic programming, tries, union-find and the rest.",
    topicIds: [
      "greedy",
      "intervals",
      "backtracking",
      "dp",
      "tries",
      "union-find",
      "bit-manipulation",
      "advanced-graphs",
      "math",
      "advanced-ds",
    ],
  },
  {
    id: "interview",
    name: "Interview Revision",
    summary: "Mixed essentials, timed practice and mock interviews.",
    topicIds: [],
  },
];

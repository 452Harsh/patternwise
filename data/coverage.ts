export type Tier = "core" | "common" | "advanced";

export interface CoverageItem {
  area: string;
  tier: Tier;
  /** Pattern ids in the curriculum that teach this area. Empty = deliberately not covered. */
  patterns: string[];
  note?: string;
}

/**
 * Checklist of what coding interviews ask, mapped to curriculum patterns.
 * tier: core = asked constantly, common = regularly, advanced = senior / occasional.
 */
export const COVERAGE: CoverageItem[] = [
  // Core
  { area: "Arrays & hashing (frequency, complement lookup)", tier: "core", patterns: ["complement-lookup", "grouping-by-key", "set-sequence"] },
  { area: "Strings: counting, two pointers, parsing", tier: "core", patterns: ["char-counting-mapping", "string-two-pointers", "parsing-simulation"] },
  { area: "Prefix sums & subarray counting", tier: "core", patterns: ["prefix-basics", "prefix-hash"] },
  { area: "Two pointers (opposite ends, read/write, partition)", tier: "core", patterns: ["opposite-ends", "read-write", "partition", "two-sequences"] },
  { area: "Sliding window (fixed, variable, at-most-K)", tier: "core", patterns: ["fixed-window", "variable-longest", "variable-shortest", "at-most-k"] },
  { area: "Binary search (boundaries, rotated, on answer)", tier: "core", patterns: ["classic-boundary", "rotated", "search-on-answer"] },
  { area: "Linked list (fast/slow, reversal, dummy node)", tier: "core", patterns: ["fast-slow", "reversal", "dummy-node"] },
  { area: "Stack: matching & expression evaluation", tier: "core", patterns: ["matching-nesting", "expression-evaluation"] },
  { area: "Monotonic stack", tier: "core", patterns: ["monotonic-stack", "monotonic-stack-contribution", "monotonic-stack-greedy"] },
  { area: "Subsets / combinations / permutations", tier: "core", patterns: ["subsets-combinations", "permutations"] },
  { area: "Backtracking on grids & constraints", tier: "core", patterns: ["constraint-search"] },
  { area: "Tree DFS (bottom-up & top-down)", tier: "core", patterns: ["dfs-bottom-up", "dfs-top-down"] },
  { area: "Tree BFS / level order", tier: "core", patterns: ["bfs-level"] },
  { area: "BST operations & in-order property", tier: "core", patterns: ["bst-search-modify", "bst-inorder", "bst-build"] },
  { area: "Heap: top-K, k-way merge, two heaps", tier: "core", patterns: ["top-k", "two-heaps", "k-way-merge"] },
  { area: "Grid DFS/BFS & flood fill", tier: "core", patterns: ["grid-flood-fill"] },
  { area: "Graph traversal & cloning", tier: "core", patterns: ["graph-traversal", "graph-reachability"] },
  { area: "Topological sort", tier: "core", patterns: ["topological-sort"] },
  { area: "Union-Find", tier: "core", patterns: ["union-find", "uf-grouping"] },
  { area: "Dijkstra / shortest path", tier: "core", patterns: ["shortest-path"] },
  { area: "Intervals: merge, insert, schedule", tier: "core", patterns: ["intervals"] },
  { area: "Greedy choice & reachability", tier: "core", patterns: ["greedy-choice"] },
  { area: "DP: 1D, knapsack, coin change", tier: "core", patterns: ["dp-1d-linear", "dp-knapsack-unbounded", "dp-knapsack-01"] },
  { area: "DP: grid & two-string (LCS, edit distance)", tier: "core", patterns: ["dp-grid", "dp-two-strings"] },
  { area: "DP: subarray (Kadane) & LIS", tier: "core", patterns: ["dp-kadane-lis"] },
  { area: "Design: LRU cache, hash+array structures", tier: "core", patterns: ["cache-design", "hash-array-design"] },

  // Common
  { area: "In-place array tricks (index as hash, rearrangement)", tier: "common", patterns: ["index-as-hash", "array-rearrangement", "boyer-moore"] },
  { area: "Matrix manipulation (spiral, rotate, simulate)", tier: "common", patterns: ["matrix-traversal", "matrix-transform", "matrix-staircase"] },
  { area: "Sorting: custom comparators, merge sort, bucket", tier: "common", patterns: ["implement-sorts", "custom-comparator", "bucket-sort"] },
  { area: "Binary search on implicit structure (peak, matrix)", tier: "common", patterns: ["binary-search-implicit", "matrix-partition"] },
  { area: "Difference array & 2D prefix sums", tier: "common", patterns: ["difference-array", "prefix-2d"] },
  { area: "Substring matching: KMP / rolling hash", tier: "common", patterns: ["string-matching"] },
  { area: "Monotonic deque (window extremum, DP optimization)", tier: "common", patterns: ["monotonic-deque", "monotonic-deque-dp"] },
  { area: "Queue/stack design & simulation", tier: "common", patterns: ["queue-design", "stack-simulation"] },
  { area: "Tree construction, serialization, trees as graphs", tier: "common", patterns: ["construct-serialize", "tree-as-graph", "tree-compare", "iterative-traversal"] },
  { area: "Recursion / divide & conquer / heavy pruning", tier: "common", patterns: ["divide-conquer", "backtracking-pruning"] },
  { area: "Multi-source & state-space BFS", tier: "common", patterns: ["bfs-shortest-unweighted"] },
  { area: "Bipartite graphs / two-colouring", tier: "common", patterns: ["graph-bipartite"] },
  { area: "Dijkstra variants, Floyd–Warshall, 0-1 BFS", tier: "common", patterns: ["sp-variants"] },
  { area: "Topological order + DP", tier: "common", patterns: ["topo-dp"] },
  { area: "Greedy: sort-and-match, feasibility", tier: "common", patterns: ["greedy-sort-match", "greedy-feasibility"] },
  { area: "Interval overlap queries & sweep line", tier: "common", patterns: ["interval-queries", "interval-heap"] },
  { area: "DP: strings (palindromes, regex), stock, counting", tier: "common", patterns: ["dp-expand-center", "dp-state-machine", "dp-stock-k", "dp-string-matching", "dp-counting-knapsack"] },
  { area: "Tries (basic and variants)", tier: "common", patterns: ["trie", "trie-variants"] },
  { area: "Bit manipulation", tier: "common", patterns: ["bits", "bits-advanced"] },
  { area: "Linked list rewiring variants", tier: "common", patterns: ["pointer-rewiring"] },
  { area: "Heap scheduling greedy", tier: "common", patterns: ["greedy-scheduling"] },

  // Advanced
  { area: "Interval DP & game DP", tier: "advanced", patterns: ["dp-interval"] },
  { area: "LIS variants & tree DP", tier: "advanced", patterns: ["dp-lis-variants", "dp-tree", "dp-grid-advanced"] },
  { area: "Bitmask DP", tier: "advanced", patterns: ["dp-bitmask"] },
  { area: "Minimum spanning tree", tier: "advanced", patterns: ["mst"] },
  { area: "Euler path, bridges, safe nodes", tier: "advanced", patterns: ["euler-path", "bridges-cycles"] },
  { area: "Segment tree / Fenwick tree", tier: "advanced", patterns: ["segment-fenwick"] },
  { area: "Math: primes, gcd, digits, randomization", tier: "advanced", patterns: ["digit-manipulation", "number-theory", "randomization", "geometry-slopes"] },
  { area: "Cache/LFU style complex designs", tier: "advanced", patterns: ["cache-design"] },

  // Known gaps (deliberately not covered)
  { area: "Suffix array / suffix automaton", tier: "advanced", patterns: [], note: "Rare in interviews; learn only for competitive programming." },
  { area: "Max-flow / bipartite matching", tier: "advanced", patterns: [], note: "Very rare in coding interview rounds." },
  { area: "Lazy segment tree, persistent structures, sqrt decomposition", tier: "advanced", patterns: [], note: "Only for specialised roles; fenwick/segment basics are covered." },
  { area: "Premium-only classics (Alien Dictionary, Meeting Rooms II, Graph Valid Tree, Number of Islands II)", tier: "common", patterns: [], note: "Referenced inside pattern notes. Practise via their free equivalents or if you have LeetCode Premium." },
];

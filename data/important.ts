/**
 * Curated "must-be-able-to-solve-cold" list for interview revision.
 * One or two canonical problems per major pattern: if you can solve these
 * from scratch and explain why the pattern applies, you can handle most variations.
 */
export const IMPORTANT: string[] = [
  // Arrays, hashing, strings
  "two-sum", "group-anagrams", "top-k-frequent-elements", "longest-consecutive-sequence",
  "product-of-array-except-self", "subarray-sum-equals-k", "majority-element", "next-permutation",
  "first-missing-positive", "valid-sudoku", "spiral-matrix", "rotate-image", "set-matrix-zeroes",
  "string-to-integer-atoi", "find-the-index-of-the-first-occurrence-in-a-string",
  // Two pointers, sliding window
  "3sum", "container-with-most-water", "trapping-rain-water", "sort-colors",
  "longest-substring-without-repeating-characters", "longest-repeating-character-replacement",
  "minimum-window-substring", "sliding-window-maximum", "permutation-in-string",
  // Sorting, binary search
  "merge-intervals", "largest-number", "search-in-rotated-sorted-array", "find-minimum-in-rotated-sorted-array",
  "koko-eating-bananas", "split-array-largest-sum", "median-of-two-sorted-arrays", "find-peak-element",
  // Linked list, stack, monotonic
  "reverse-linked-list", "linked-list-cycle-ii", "merge-two-sorted-lists", "reorder-list",
  "remove-nth-node-from-end-of-list", "copy-list-with-random-pointer", "reverse-nodes-in-k-group",
  "valid-parentheses", "min-stack", "decode-string", "basic-calculator-ii",
  "daily-temperatures", "largest-rectangle-in-histogram", "next-greater-element-ii", "remove-k-digits",
  // Recursion, trees, BST
  "subsets", "permutations", "combination-sum", "word-search", "n-queens", "generate-parentheses",
  "maximum-depth-of-binary-tree", "diameter-of-binary-tree", "lowest-common-ancestor-of-a-binary-tree",
  "binary-tree-level-order-traversal", "binary-tree-right-side-view", "binary-tree-maximum-path-sum",
  "construct-binary-tree-from-preorder-and-inorder-traversal", "serialize-and-deserialize-binary-tree",
  "validate-binary-search-tree", "kth-smallest-element-in-a-bst", "path-sum-iii",
  // Heap
  "kth-largest-element-in-an-array", "k-closest-points-to-origin", "merge-k-sorted-lists",
  "find-median-from-data-stream", "task-scheduler",
  // Graphs
  "number-of-islands", "rotting-oranges", "pacific-atlantic-water-flow", "clone-graph", "course-schedule",
  "course-schedule-ii", "word-ladder", "redundant-connection", "accounts-merge", "network-delay-time",
  "cheapest-flights-within-k-stops", "is-graph-bipartite", "min-cost-to-connect-all-points",
  "evaluate-division", "reconstruct-itinerary",
  // Greedy, intervals
  "jump-game", "jump-game-ii", "gas-station", "partition-labels", "non-overlapping-intervals", "insert-interval",
  "meeting-rooms-iii",
  // DP
  "climbing-stairs", "house-robber", "coin-change", "word-break", "longest-increasing-subsequence",
  "partition-equal-subset-sum", "target-sum", "unique-paths", "maximal-square", "longest-common-subsequence",
  "edit-distance", "longest-palindromic-substring", "maximum-subarray", "maximum-product-subarray",
  "best-time-to-buy-and-sell-stock-with-cooldown", "burst-balloons", "decode-ways", "regular-expression-matching",
  // Tries, bits, design
  "implement-trie-prefix-tree", "word-search-ii", "single-number", "counting-bits", "sum-of-two-integers",
  "lru-cache", "lfu-cache", "insert-delete-getrandom-o1", "time-based-key-value-store", "range-sum-query-mutable",
];

export const IMPORTANT_SET = new Set(IMPORTANT);

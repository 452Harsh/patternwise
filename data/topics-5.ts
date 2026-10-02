import { P, type Pattern, type Topic } from "./types";

/* ---------- Trees ---------- */

export const treeExtras: Pattern[] = [
  {
    id: "tree-compare",
    subtopic: "Recursion on trees",
    name: "Comparing & Matching Trees",
    signals: ["Are two trees identical / mirror images?", "Is one tree a subtree of another?"],
    approach: "Recurse on two nodes at once: both null → true, one null → false, values differ → false, then compare children (same-direction for identical, crossed for mirror). Subtree = identical check at every node.",
    variations: ["Serialize both trees and use substring search", "Iterative with a stack of node pairs"],
    pitfalls: ["Null handling order", "Mirror compares left with right"],
    transfer: ["Merge Two Binary Trees", "Any problem walking two structures in lockstep"],
    problems: [
      P("same-tree", "Same Tree", "Easy", "Walk both trees together."),
      P("symmetric-tree", "Symmetric Tree", "Easy", "Compare left.left with right.right."),
      P("subtree-of-another-tree", "Subtree of Another Tree", "Easy", "Same-tree check at each node."),
    ],
  },
  {
    id: "iterative-traversal",
    subtopic: "Traversals",
    name: "Iterative Traversals (Stack)",
    signals: ["Do traversal without recursion", "In-order with O(1) memory", "Need to pause and resume traversal (iterator)"],
    approach: "In-order: push left spine, pop, visit, move to right child. Pre-order: pop, visit, push right then left. Post-order: reverse of (root, right, left). Morris traversal threads the tree for O(1) space.",
    template: `st, cur = [], root
while cur or st:
    while cur: st.append(cur); cur = cur.left
    cur = st.pop(); visit(cur)
    cur = cur.right`,
    variations: ["Morris traversal", "Generator / iterator object"],
    pitfalls: ["Post-order is the hardest to get right iteratively"],
    transfer: ["BST iterator", "Kth smallest in BST (stop early)"],
    problems: [
      P("binary-tree-inorder-traversal", "Binary Tree Inorder Traversal", "Easy", "Push left spine, pop, go right."),
      P("binary-tree-postorder-traversal", "Binary Tree Postorder Traversal", "Easy", "Reverse of root-right-left."),
    ],
  },
  {
    id: "tree-as-graph",
    subtopic: "Construction & graph views",
    name: "Tree as a Graph (Parent Pointers, Coordinates)",
    signals: ["Distance from a node in all directions", "Spread (infection, fire) from a starting node", "Order nodes by column/row coordinates"],
    approach: "Add parent pointers (DFS building a parent map) so you can walk up as well as down, then run BFS from the target with a visited set. For coordinate ordering, DFS/BFS recording (row, col) and sort.",
    variations: ["Build an undirected adjacency list from the tree", "Sort by (col, row, value)"],
    pitfalls: ["Revisiting the parent without a visited set"],
    transfer: ["Any tree problem needing 'upward' movement", "Graph BFS by levels"],
    problems: [
      P("all-nodes-distance-k-in-binary-tree", "All Nodes Distance K in Binary Tree", "Medium", "Parent map + BFS."),
      P("amount-of-time-for-binary-tree-to-be-infected", "Amount of Time for Binary Tree to Be Infected", "Medium", "BFS levels from the start node."),
      P("vertical-order-traversal-of-a-binary-tree", "Vertical Order Traversal of a Binary Tree", "Hard", "Record (col, row, val) and sort."),
    ],
  },
];

/* ---------- BST ---------- */

export const bst: Topic = {
  id: "bst",
  name: "Binary Search Trees",
  blurb: "Left < node < right gives you O(h) search and sorted order via in-order traversal.",
  patterns: [
    {
      id: "bst-search-modify",
      name: "Search, Insert, Delete, Validate",
      signals: ["Tree is a BST and you must find / add / remove a value", "Validate the BST property", "Find the LCA using ordering"],
      approach: "Compare to the node and go left or right — never both. Delete: leaf → remove, one child → replace with the child, two children → replace with the in-order successor, then delete that successor. Validate with (lo, hi) bounds, not parent-only checks.",
      template: `def insert(node, v):
    if not node: return Node(v)
    if v < node.val: node.left = insert(node.left, v)
    else: node.right = insert(node.right, v)
    return node`,
      variations: ["Iterative descent", "Predecessor vs. successor on delete", "Both targets on one side → go there; split → current node is the LCA"],
      pitfalls: ["Validate by bounds, not by comparing only with the parent", "Return the (possibly new) subtree root from recursive modifications"],
      transfer: ["Any search structure with ordering", "Balanced BST ideas behind TreeMap / ordered sets"],
      problems: [
        P("search-in-a-binary-search-tree", "Search in a Binary Search Tree", "Easy", "Go left or right by comparison."),
        P("insert-into-a-binary-search-tree", "Insert into a Binary Search Tree", "Medium", "Descend to the null slot."),
        P("validate-binary-search-tree", "Validate Binary Search Tree", "Medium", "Carry (lo, hi) bounds down."),
        P("lowest-common-ancestor-of-a-binary-search-tree", "Lowest Common Ancestor of a Binary Search Tree", "Medium", "Walk down until p and q split."),
        P("delete-node-in-a-bst", "Delete Node in a BST", "Medium", "Replace with the in-order successor."),
      ],
    },
    {
      id: "bst-inorder",
      name: "In-Order = Sorted Order",
      signals: ["k-th smallest, minimum difference, recover swapped nodes", "Iterate BST lazily"],
      approach: "In-order traversal visits values in ascending order. Keep a 'previous' pointer to compare neighbours (min difference, swapped-node detection) or a counter to stop at the k-th element.",
      variations: ["Iterator with an explicit stack", "Count subtree sizes for repeated k-th queries"],
      pitfalls: ["Two swapped nodes: record first and last violations"],
      transfer: ["Convert BST to sorted list / greater tree", "Two-sum on BST using two iterators"],
      problems: [
        P("kth-smallest-element-in-a-bst", "Kth Smallest Element in a BST", "Medium", "Stop the in-order walk at k."),
        P("minimum-absolute-difference-in-bst", "Minimum Absolute Difference in BST", "Easy", "Compare consecutive in-order values."),
        P("binary-search-tree-iterator", "Binary Search Tree Iterator", "Medium", "Stack holds the left spine."),
        P("recover-binary-search-tree", "Recover Binary Search Tree", "Medium", "Find the two out-of-order pairs."),
      ],
    },
    {
      id: "bst-build",
      name: "Build Balanced BSTs / Count BSTs",
      signals: ["Convert a sorted array/list to a height-balanced BST", "Count structurally distinct BSTs"],
      approach: "Pick the middle element as the root and recurse on each half. Counting BSTs: choose each i as root, multiply left and right counts (Catalan numbers).",
      variations: ["Sorted list: simulate in-order construction to avoid finding the middle repeatedly"],
      pitfalls: ["Choosing the same middle every time can break balance by one"],
      transfer: ["Divide & conquer on sorted data", "Catalan-style DP"],
      problems: [
        P("convert-sorted-array-to-binary-search-tree", "Convert Sorted Array to Binary Search Tree", "Easy", "Middle becomes the root."),
        P("convert-sorted-list-to-binary-search-tree", "Convert Sorted List to Binary Search Tree", "Medium", "Slow/fast to find the middle, or in-order build."),
        P("unique-binary-search-trees", "Unique Binary Search Trees", "Medium", "Σ left × right over every root choice."),
      ],
    },
  ],
};

/* ---------- Recursion ---------- */

export const recursionExtras: Pattern[] = [
  {
    id: "divide-conquer",
    name: "Recursion Basics & Divide and Conquer",
    signals: ["Problem of size n reduces to size n/2 or n−1", "Compute x^n fast", "Combine results of independent halves"],
    approach: "State the recursive definition, the base case and how the sub-answers combine. Halving gives O(log n) (fast power) or O(n log n) (merge sort). Memoize if sub-calls overlap.",
    variations: ["Fast exponentiation, including negative exponents", "Different ways to add parentheses = split at every operator and combine"],
    pitfalls: ["Missing base case", "Integer overflow of −n when n = INT_MIN", "Recomputing identical sub-calls (add a cache)"],
    transfer: ["Merge sort, quick sort", "Closest pair, tree problems", "Memoized recursion → DP"],
    problems: [
      P("fibonacci-number", "Fibonacci Number", "Easy", "Recursion → memo → iteration."),
      P("powx-n", "Pow(x, n)", "Medium", "Square the half power."),
      P("k-th-symbol-in-grammar", "K-th Symbol in Grammar", "Medium", "Recurse to the parent row and flip."),
      P("different-ways-to-add-parentheses", "Different Ways to Add Parentheses", "Medium", "Split at each operator, combine all pairs."),
    ],
  },
  {
    id: "backtracking-pruning",
    name: "Backtracking with Heavy Pruning",
    signals: ["Exponential search that must be cut aggressively", "Partition into groups with equal sums", "Fill a board satisfying many constraints"],
    approach: "Order choices to fail fast (largest first), skip symmetric states (duplicate values, empty-bucket repeats), and maintain constraint sets incrementally so each check is O(1).",
    variations: ["Bitmask for used items", "Constraint propagation for sudoku"],
    pitfalls: ["Pruning too late", "Forgetting to undo state on all return paths"],
    transfer: ["N-Queens", "Word Search", "Any NP-hard-looking puzzle with small n"],
    problems: [
      P("restore-ip-addresses", "Restore IP Addresses", "Medium", "Four segments, each ≤ 3 digits and ≤ 255."),
      P("partition-to-k-equal-sum-subsets", "Partition to K Equal Sum Subsets", "Medium", "Fill buckets; skip equal-state retries."),
      P("expression-add-operators", "Expression Add Operators", "Hard", "Carry last operand to handle multiplication."),
      P("sudoku-solver", "Sudoku Solver", "Hard", "Row/col/box sets + try digits."),
    ],
  },
];

/* ---------- Graph family ---------- */

export const graphExtras: Pattern[] = [
  {
    id: "graph-reachability",
    name: "Reachability & Path Enumeration",
    signals: ["Is there a path between two nodes?", "List all paths in a DAG", "Rooms / keys / unlocking"],
    approach: "DFS or BFS from the source with a visited set. In a DAG, path enumeration needs no visited set but is exponential in the worst case — memoize counts instead if only counting.",
    variations: ["Bidirectional BFS for large search spaces"],
    pitfalls: ["Building adjacency incorrectly for undirected edges"],
    transfer: ["Number of Provinces", "Keys & Rooms style unlock problems", "Any 'can I reach X' question"],
    problems: [
      P("find-if-path-exists-in-graph", "Find if Path Exists in Graph", "Easy", "Plain DFS/BFS."),
      P("keys-and-rooms", "Keys and Rooms", "Medium", "Traverse; every room must be visited."),
      P("all-paths-from-source-to-target", "All Paths From Source to Target", "Medium", "DFS with path backtracking."),
    ],
  },
  {
    id: "graph-bipartite",
    name: "Bipartite / Two-Colouring",
    signals: ["Split nodes into two groups with no conflict inside a group", "Dislikes / enemies / odd cycle", "Colour with two colours"],
    approach: "BFS/DFS assigning alternating colours. If an edge connects equal colours, the graph has an odd cycle and is not bipartite. Handle every component.",
    variations: ["Union-find with 'enemy' links"],
    pitfalls: ["Disconnected graph: start from every uncoloured node"],
    transfer: ["Cycle parity questions", "2-SAT-like grouping puzzles"],
    problems: [
      P("is-graph-bipartite", "Is Graph Bipartite?", "Medium", "Alternate colours; a conflict means an odd cycle."),
      P("possible-bipartition", "Possible Bipartition", "Medium", "Build the dislike graph, then 2-colour."),
    ],
  },
  {
    id: "bfs-shortest-unweighted",
    name: "BFS Shortest Path (Unweighted / State Graph)",
    signals: ["Minimum number of moves / steps / mutations", "Implicit graph: states are nodes, moves are edges", "All edges cost 1"],
    approach: "Model states as nodes and legal moves as edges. BFS from the start; the first time you reach the goal is the shortest distance. Mark visited when enqueuing.",
    variations: ["Multi-source BFS", "Bidirectional BFS", "State = (position, extra info like keys)"],
    pitfalls: ["Marking visited on dequeue inflates the queue", "Forgetting dead-end/forbidden states"],
    transfer: ["Word Ladder", "Rotting Oranges", "Any puzzle solved in minimum moves"],
    problems: [
      P("shortest-path-in-binary-matrix", "Shortest Path in Binary Matrix", "Medium", "8-direction BFS."),
      P("01-matrix", "01 Matrix", "Medium", "Multi-source BFS from all zeros."),
      P("open-the-lock", "Open the Lock", "Medium", "States are 4-digit strings; skip deadends."),
      P("snakes-and-ladders", "Snakes and Ladders", "Medium", "BFS over squares with board mapping."),
    ],
  },
];

export const topoExtras: Pattern[] = [
  {
    id: "topo-dp",
    name: "Topological Order + DP (Longest Path in DAG)",
    signals: ["Dependencies with durations or counts", "Recipes that need ingredients that are themselves recipes", "Longest increasing path in a grid"],
    approach: "Process nodes in topological order and propagate best values to successors: dp[v] = max(dp[v], dp[u] + cost). A grid with strictly increasing steps is already a DAG, so DFS + memo works.",
    variations: ["Kahn's levels = earliest start times", "Memoized DFS replaces explicit sort"],
    pitfalls: ["Cycle detection still required"],
    transfer: ["Project scheduling / critical path", "Alien Dictionary (premium) — build edges from adjacent words, then topo sort"],
    problems: [
      P("find-all-possible-recipes-from-given-supplies", "Find All Possible Recipes from Given Supplies", "Medium", "Kahn's algorithm with ingredients as edges."),
      P("parallel-courses-iii", "Parallel Courses III", "Hard", "Longest path in a DAG with durations."),
      P("longest-increasing-path-in-a-matrix", "Longest Increasing Path in a Matrix", "Hard", "DFS + memo on an implicit DAG."),
    ],
  },
];

export const ufExtras: Pattern[] = [
  {
    id: "uf-grouping",
    name: "Union-Find: Grouping by Constraints",
    signals: ["Items connected by equality, shared rows/columns, or allowed swaps", "Components then process each group independently", "Ratios/relations that chain (a/b, b/c)"],
    approach: "Union items implied connected, then handle each component: sort characters inside a component, count components, or evaluate relations along the weighted path. Weighted union-find stores the ratio to the root.",
    variations: ["Union rows with columns (offset columns) for stones", "Weighted DSU with path compression updating ratios"],
    pitfalls: ["Process equalities before inequalities", "Update weights during path compression"],
    transfer: ["Accounts Merge", "Number of Provinces", "Network connectivity queries"],
    problems: [
      P("satisfiability-of-equality-equations", "Satisfiability of Equality Equations", "Medium", "Union all '==', then check '!='."),
      P("most-stones-removed-with-same-row-or-column", "Most Stones Removed with Same Row or Column", "Medium", "Answer = stones − components."),
      P("smallest-string-with-swaps", "Smallest String With Swaps", "Medium", "Sort characters within each component."),
      P("evaluate-division", "Evaluate Division", "Medium", "Weighted graph / weighted union-find."),
    ],
  },
];

export const spExtras: Pattern[] = [
  {
    id: "sp-variants",
    name: "Dijkstra Variants & All-Pairs / 0-1 BFS",
    signals: ["Maximize probability (product) instead of minimizing sum", "Minimize the maximum height/effort along a path", "Small n and all-pairs distances", "Edge weights only 0 or 1"],
    approach: "Dijkstra works for any monotone cost: use a max-heap for probabilities, max() for bottleneck paths. Floyd–Warshall gives all-pairs in O(n³). 0-1 BFS uses a deque: push 0-weight edges to the front and 1-weight to the back.",
    template: `for k in range(n):
    for i in range(n):
        for j in range(n):
            d[i][j] = min(d[i][j], d[i][k] + d[k][j])`,
    variations: ["Bellman–Ford for negative edges / at most K edges", "Binary search + BFS as an alternative for bottleneck paths"],
    pitfalls: ["Floyd–Warshall loop order: k must be outermost", "Dijkstra with negative edges"],
    transfer: ["Network Delay Time", "Cheapest Flights Within K Stops", "Grid problems with terrain costs"],
    problems: [
      P("path-with-maximum-probability", "Path with Maximum Probability", "Medium", "Dijkstra with max-heap on product."),
      P("find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance", "Find the City With the Smallest Number of Neighbors at a Threshold Distance", "Medium", "Floyd–Warshall then count."),
      P("swim-in-rising-water", "Swim in Rising Water", "Hard", "Minimize the max cell value along a path."),
      P("minimum-obstacle-removal-to-reach-corner", "Minimum Obstacle Removal to Reach Corner", "Hard", "0-1 BFS with a deque."),
    ],
  },
];

export const advancedGraphs: Topic = {
  id: "advanced-graphs",
  name: "Advanced Graphs",
  blurb: "Spanning trees, Euler paths, bridges. Less common, but they separate strong candidates at senior levels.",
  patterns: [
    {
      id: "mst",
      name: "Minimum Spanning Tree (Kruskal / Prim)",
      signals: ["Connect all nodes at minimum total cost", "Cheapest network / cable / road layout"],
      approach: "Kruskal: sort edges by weight, add an edge if it joins two different components (union-find). Prim: grow from a node with a min-heap of crossing edges. Both are O(E log E).",
      variations: ["Complete graph with Manhattan distances (Prim without building all edges)", "Edge criticality: edge is critical if removing it raises the MST weight"],
      pitfalls: ["Graph must be connected", "Number of edges used must equal n − 1"],
      transfer: ["Clustering (stop Kruskal at k components)", "Redundant Connection (cycle detection with DSU)"],
      problems: [
        P("min-cost-to-connect-all-points", "Min Cost to Connect All Points", "Medium", "Prim or Kruskal on Manhattan distances."),
        P("find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree", "Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree", "Hard", "Recompute the MST excluding / forcing each edge."),
      ],
    },
    {
      id: "euler-path",
      name: "Eulerian Path (Hierholzer)",
      signals: ["Use every edge exactly once", "Reconstruct an itinerary / sequence from tickets", "De Bruijn-like sequences"],
      approach: "DFS taking edges in lexical order and appending a node to the answer only after all its outgoing edges are used (post-order). Reverse the result at the end.",
      variations: ["Directed vs. undirected existence conditions via degrees"],
      pitfalls: ["Appending before exhausting edges gives a wrong order"],
      transfer: ["Cracking the Safe", "Valid Arrangement of Pairs"],
      problems: [P("reconstruct-itinerary", "Reconstruct Itinerary", "Hard", "Hierholzer with sorted destinations.")],
    },
    {
      id: "bridges-cycles",
      name: "Bridges, Articulation Points & Safe Nodes",
      signals: ["Critical connections whose removal disconnects the graph", "Nodes that never lead into a cycle"],
      approach: "Tarjan: DFS with discovery time and low-link; an edge u→v is a bridge if low[v] > disc[u]. For safe nodes use 3-colour DFS (unvisited / visiting / safe) or reverse-graph topological sort.",
      variations: ["Articulation points: low[v] ≥ disc[u] with the root special case"],
      pitfalls: ["Skip the parent edge when computing low-link in undirected graphs"],
      transfer: ["Strongly connected components", "Network reliability questions"],
      problems: [
        P("find-eventual-safe-states", "Find Eventual Safe States", "Medium", "3-colour DFS / reverse topological sort."),
        P("critical-connections-in-a-network", "Critical Connections in a Network", "Hard", "Tarjan low-link bridges."),
      ],
    },
  ],
};

/* ---------- DP extras ---------- */

export const dpExtras: Pattern[] = [
  {
    id: "dp-lis-variants",
    subtopic: "Subarray & Subsequence",
    name: "LIS Variants (Chains, Envelopes, Counting)",
    signals: ["Longest chain under a pairwise order", "Nested boxes/envelopes", "Count how many optimal subsequences exist"],
    approach: "Sort so one dimension is handled, then run LIS on the other (for envelopes, sort width ascending and height descending). Counting LIS stores (length, count) per index.",
    variations: ["Divisibility chains: sort then dp[i] = max dp[j] with a[i] % a[j] == 0", "Patience sorting with bisect for O(n log n)"],
    pitfalls: ["Equal widths must not chain (sort heights descending)"],
    transfer: ["Box stacking, Longest String Chain", "Scheduling with dependencies"],
    problems: [
      P("number-of-longest-increasing-subsequence", "Number of Longest Increasing Subsequence", "Medium", "Track (length, count) per index."),
      P("largest-divisible-subset", "Largest Divisible Subset", "Medium", "Sort then LIS with a divisibility test."),
      P("longest-string-chain", "Longest String Chain", "Medium", "Sort by length; dp over deletions of one char."),
      P("russian-doll-envelopes", "Russian Doll Envelopes", "Hard", "Sort w asc, h desc; LIS on h."),
    ],
  },
  {
    id: "dp-grid-advanced",
    subtopic: "Grid & Strings",
    name: "Grid DP: Triangles, Falling Paths, Reverse DP",
    signals: ["Triangle / falling path with adjacent choices", "Minimum initial health needed (decision depends on the future)"],
    approach: "Standard grid DP when cost accumulates forward. When the requirement depends on what comes later (dungeon), run the DP backwards from the goal.",
    variations: ["Bottom-up on a triangle in O(n) space"],
    pitfalls: ["Direction of iteration", "Health can never drop below 1"],
    transfer: ["Unique Paths, Minimum Path Sum", "Cherry-pickup-like two-agent DP"],
    problems: [
      P("triangle", "Triangle", "Medium", "Collapse from the bottom row up."),
      P("minimum-falling-path-sum", "Minimum Falling Path Sum", "Medium", "Min of three cells above."),
      P("dungeon-game", "Dungeon Game", "Hard", "Backward DP from the princess."),
    ],
  },
  {
    id: "dp-string-matching",
    subtopic: "Grid & Strings",
    name: "String DP: Matching, Interleaving, Partition Cost",
    signals: ["Pattern matching with wildcards ('.', '*', '?')", "Interleave two strings into a third", "Minimum cuts to partition into palindromes"],
    approach: "dp[i][j] over prefixes of the two strings (or string and pattern). For '*', either skip the starred token or consume a character and stay. Precompute a palindrome table for partition-cost problems.",
    variations: ["Top-down memo is often easier to write for regex", "1D rolling array"],
    pitfalls: ["Base cases for patterns that match empty strings (a*b*)", "Ordering of '*' transitions"],
    transfer: ["Edit Distance, LCS", "Word Break II"],
    problems: [
      P("interleaving-string", "Interleaving String", "Medium", "dp[i][j]: first i of s1 and j of s2 form s3[:i+j]."),
      P("wildcard-matching", "Wildcard Matching", "Hard", "'*' matches empty or one more char."),
      P("regular-expression-matching", "Regular Expression Matching", "Hard", "'x*' means skip it or consume x."),
      P("palindrome-partitioning-ii", "Palindrome Partitioning II", "Hard", "Palindrome table + min cuts dp."),
    ],
  },
  {
    id: "dp-counting-knapsack",
    subtopic: "Linear & Knapsack",
    name: "Counting & Multi-Dimensional Knapsack",
    signals: ["Fewest squares / pieces summing to n", "Two resource limits (zeros and ones)", "Ordered combinations (permutation count) summing to target"],
    approach: "Knapsack with a richer state: one dimension per resource, or dp[n] over smaller values. Iterate targets outside for ordered counts; items outside for unordered.",
    variations: ["dp[i] = max product after splitting", "Parentheses validity with a stack of indices or two scans"],
    pitfalls: ["Iterating resources forward re-uses an item"],
    transfer: ["Coin Change family", "Subset Sum / Target Sum"],
    problems: [
      P("perfect-squares", "Perfect Squares", "Medium", "Coin change where coins are squares."),
      P("integer-break", "Integer Break", "Medium", "dp[n] = max over splits of j × max(n−j, dp[n−j])."),
      P("combination-sum-iv", "Combination Sum IV", "Medium", "Target outer loop counts ordered sequences."),
      P("ones-and-zeroes", "Ones and Zeroes", "Medium", "2D 0/1 knapsack, iterate backwards."),
      P("longest-valid-parentheses", "Longest Valid Parentheses", "Hard", "dp ending at ')' or stack of indices."),
    ],
  },
  {
    id: "dp-stock-k",
    subtopic: "Advanced states",
    name: "Stock Problems with K Transactions / Fee",
    signals: ["At most k buy–sell transactions", "Transaction fee", "States: holding vs. not, per transaction count"],
    approach: "State (day, transactions used, holding?). hold[j] = max(hold[j], free[j−1] − price); free[j] = max(free[j], hold[j] + price). For unlimited transactions with a fee only two states are needed.",
    variations: ["k ≥ n/2 collapses to unlimited (greedy)", "Add a cooldown state"],
    pitfalls: ["Deduct the fee exactly once", "Update order within a day"],
    transfer: ["Any 'sequence of actions with mode' problem"],
    problems: [
      P("best-time-to-buy-and-sell-stock-with-transaction-fee", "Best Time to Buy and Sell Stock with Transaction Fee", "Medium", "Two-state hold/free."),
      P("best-time-to-buy-and-sell-stock-iii", "Best Time to Buy and Sell Stock III", "Hard", "Four states for two transactions."),
      P("best-time-to-buy-and-sell-stock-iv", "Best Time to Buy and Sell Stock IV", "Hard", "hold[j]/free[j] for each transaction count."),
    ],
  },
  {
    id: "dp-interval",
    subtopic: "Advanced states",
    name: "Interval DP & Game DP",
    signals: ["Choose the last / first element to remove or split in a range", "Two players pick from the ends optimally", "dp[l][r] depends on smaller subranges"],
    approach: "dp[l][r] is the answer for the range. Iterate by increasing length, trying each split point k with dp[l][k] and dp[k+1][r]. For burst-balloons think about the LAST balloon popped in the range. For two-player games store the score difference.",
    template: `for length in range(2, n + 1):
    for l in range(0, n - length + 1):
        r = l + length - 1
        dp[l][r] = best(dp[l][k] + dp[k+1][r] + cost for k in l..r-1)`,
    variations: ["Memoized recursion over (l, r)", "Score-difference formulation for games"],
    pitfalls: ["Padding sentinel balloons", "Iteration order must go from short to long ranges"],
    transfer: ["Matrix chain multiplication", "Optimal BST", "Stone merge problems"],
    problems: [
      P("longest-palindromic-subsequence", "Longest Palindromic Subsequence", "Medium", "dp[l][r] from the ends."),
      P("predict-the-winner", "Predict the Winner", "Medium", "dp[l][r] = best score difference."),
      P("minimum-score-triangulation-of-polygon", "Minimum Score Triangulation of Polygon", "Medium", "Choose the apex of the last triangle."),
      P("burst-balloons", "Burst Balloons", "Hard", "Think of the LAST balloon to burst."),
    ],
  },
  {
    id: "dp-tree",
    subtopic: "Advanced states",
    name: "DP on Trees",
    signals: ["Choose nodes with a parent–child restriction", "Minimum cameras/guards to cover a tree", "State per node: taken / not taken / covered"],
    approach: "Post-order DFS returning a small tuple of states for each subtree (e.g. (rob, skip)). The parent combines its children's tuples.",
    variations: ["Rerooting for answers from every root", "Greedy covered/camera/needs states"],
    pitfalls: ["Define states so each child state is independent of the parent decision"],
    transfer: ["Binary Tree Maximum Path Sum", "Diameter", "Max independent set on trees"],
    problems: [
      P("house-robber-iii", "House Robber III", "Medium", "Return (rob this node, skip this node)."),
      P("binary-tree-cameras", "Binary Tree Cameras", "Hard", "Three states: has camera / covered / needs cover."),
    ],
  },
  {
    id: "dp-bitmask",
    subtopic: "Advanced states",
    name: "Bitmask DP",
    signals: ["n ≤ ~20 items; need to know which are already used", "Visit all nodes / assign people to tasks / players choose numbers"],
    approach: "Encode the set of used items as a bitmask; dp[mask] (or dp[mask][last]) stores the best result for that set. Transition by adding one more item. Complexity O(2ⁿ · n).",
    variations: ["dp[mask][node] for TSP-like routes", "Memoize game states by mask"],
    pitfalls: ["Constraints around n = 20 are the signal; larger n means another approach"],
    transfer: ["Traveling salesman", "Partition to K Equal Sum Subsets (bitmask version)"],
    problems: [
      P("can-i-win", "Can I Win", "Medium", "Memoize by the mask of used numbers."),
      P("shortest-path-visiting-all-nodes", "Shortest Path Visiting All Nodes", "Hard", "BFS over (mask, node)."),
      P("smallest-sufficient-team", "Smallest Sufficient Team", "Hard", "dp[skill mask] = smallest team."),
    ],
  },
];

/* ---------- Greedy & intervals ---------- */

export const greedyExtras: Pattern[] = [
  {
    id: "greedy-sort-match",
    name: "Sort, Then Match / Assign",
    signals: ["Pair items from two groups", "Boats, cookies, tasks, workers", "Reconstruct by ranks"],
    approach: "Sort one (or both) sides, then use a two-pointer or a pass that always pairs the most constrained item first. Exchange argument: swapping any other pairing cannot improve the result.",
    variations: ["Two passes (left-to-right then right-to-left) for neighbour constraints"],
    pitfalls: ["Sort key choice: weakest-first vs. strongest-first"],
    transfer: ["Meeting room assignment", "Interval scheduling"],
    problems: [
      P("assign-cookies", "Assign Cookies", "Easy", "Match smallest cookie that satisfies each child."),
      P("boats-to-save-people", "Boats to Save People", "Medium", "Pair the heaviest with the lightest."),
      P("two-city-scheduling", "Two City Scheduling", "Medium", "Sort by cost difference."),
      P("queue-reconstruction-by-height", "Queue Reconstruction by Height", "Medium", "Sort tall-first, insert at index k."),
      P("candy", "Candy", "Hard", "Left pass and right pass."),
    ],
  },
  {
    id: "greedy-feasibility",
    name: "Greedy Feasibility with Counters",
    signals: ["Is it possible to form groups / match brackets with wildcards?", "Track a range of possible states"],
    approach: "Maintain the minimum and maximum possible 'open' count (or counts per value) as you scan. Fail if the range becomes impossible; succeed if zero stays in the final range.",
    variations: ["Ordered map / counter of remaining cards"],
    pitfalls: ["Clamp the lower bound to zero"],
    transfer: ["Valid Parentheses variants", "Scheduling feasibility"],
    problems: [
      P("valid-parenthesis-string", "Valid Parenthesis String", "Medium", "Track [lo, hi] of open brackets."),
      P("hand-of-straights", "Hand of Straights", "Medium", "Always start the group from the smallest card."),
      P("merge-triplets-to-form-target-triplet", "Merge Triplets to Form Target Triplet", "Medium", "Only use triplets not exceeding the target."),
    ],
  },
];

export const intervalsExtras: Pattern[] = [
  {
    id: "interval-queries",
    name: "Two Interval Lists & Overlap Checks",
    signals: ["Intersect two sorted interval lists", "Book events without overlap", "Remove intervals covered by others"],
    approach: "Two pointers over sorted lists: intersection = [max(starts), min(ends)] if valid; advance the list whose interval ends first. For booking, intervals overlap iff start < other.end and end > other.start.",
    variations: ["Sorted container / BST for online bookings"],
    pitfalls: ["Overlap uses strict < for half-open intervals"],
    transfer: ["Merge Intervals", "Meeting Rooms"],
    problems: [
      P("my-calendar-i", "My Calendar I", "Medium", "Check overlap against existing bookings."),
      P("remove-covered-intervals", "Remove Covered Intervals", "Medium", "Sort by start asc, end desc."),
      P("interval-list-intersections", "Interval List Intersections", "Medium", "Two pointers; advance the earlier end."),
    ],
  },
  {
    id: "interval-heap",
    name: "Sweep Line & Rooms (Heap of End Times)",
    signals: ["Minimum number of rooms / resources", "Maximum concurrent events", "Queries ask 'smallest interval containing x'"],
    approach: "Sort by start. Keep a min-heap of end times; pop everything that ended before the new start, push the new end. The heap size is the number of concurrent intervals. Offline queries: sort queries too and sweep.",
    variations: ["Event sweep with +1/−1 points", "Meeting Rooms II (premium) is the canonical version"],
    pitfalls: ["Ending at time t and starting at t: can they share a room?"],
    transfer: ["Task scheduling with deadlines", "CPU / server allocation"],
    problems: [
      P("meeting-rooms-iii", "Meeting Rooms III", "Hard", "Two heaps: free rooms and busy rooms."),
      P("minimum-interval-to-include-each-query", "Minimum Interval to Include Each Query", "Hard", "Sort queries; heap of (size, end)."),
    ],
  },
];

/* ---------- Tries, bits, math, advanced DS ---------- */

export const trieExtras: Pattern[] = [
  {
    id: "trie-variants",
    name: "Trie Variants (Replace, Sum, XOR)",
    signals: ["Replace words by their shortest dictionary prefix", "Aggregate values by prefix", "Maximum XOR of two numbers"],
    approach: "Store extra data on trie nodes (counts, sums). For maximum XOR, build a binary trie of the numbers' bits and, for each number, greedily walk to the opposite bit when available.",
    variations: ["Binary trie with 31/32 levels", "Prefix → sum stored at every node on the path"],
    pitfalls: ["Updating a key twice must replace, not add, its previous value"],
    transfer: ["Autocomplete", "Longest common prefix of many strings"],
    problems: [
      P("replace-words", "Replace Words", "Medium", "Walk the trie until the first end-of-word."),
      P("map-sum-pairs", "Map Sum Pairs", "Medium", "Store prefix sums on nodes; track deltas."),
      P("maximum-xor-of-two-numbers-in-an-array", "Maximum XOR of Two Numbers in an Array", "Medium", "Binary trie, go opposite bit."),
    ],
  },
];

export const bitExtras: Pattern[] = [
  {
    id: "bits-advanced",
    name: "Bit Tricks: Counting, Masks & Ranges",
    signals: ["Every element appears 3 times except one", "Two unique elements among pairs", "Common prefix of a numeric range"],
    approach: "Count each bit position mod 3 for the 'three times' case. For two uniques, XOR everything, isolate any set bit (x & −x), and split numbers into two groups by that bit. Range AND = common binary prefix of the endpoints.",
    variations: ["Total Hamming distance by column counts"],
    pitfalls: ["Signed overflow in Java/C++, unbounded ints in Python"],
    transfer: ["Subset enumeration via masks", "Bitmask DP"],
    problems: [
      P("power-of-two", "Power of Two", "Easy", "n > 0 and n & (n−1) == 0."),
      P("reverse-bits", "Reverse Bits", "Easy", "Shift bits out and in."),
      P("single-number-ii", "Single Number II", "Medium", "Count each bit mod 3."),
      P("single-number-iii", "Single Number III", "Medium", "Split by the lowest set bit of the XOR."),
      P("bitwise-and-of-numbers-range", "Bitwise AND of Numbers Range", "Medium", "Shift both until they are equal."),
      P("total-hamming-distance", "Total Hamming Distance", "Medium", "Per bit: ones × zeros."),
    ],
  },
];

export const math: Topic = {
  id: "math",
  name: "Math, Number Theory & Randomization",
  blurb: "Small but frequent: digit manipulation, primes/gcd, probability-based design.",
  patterns: [
    {
      id: "digit-manipulation",
      name: "Digit & Number Manipulation",
      signals: ["Reverse / add one / convert between numeral systems", "Palindromic numbers", "Overflow limits mentioned"],
      approach: "Peel digits with % 10 and / 10, or convert to string. Check overflow before multiplying. Base conversions use repeated division with a remainder offset (1-indexed columns).",
      variations: ["Compare half of the digits for palindromes", "Roman numerals: subtract if the next symbol is bigger"],
      pitfalls: ["Overflow in intermediate results", "Negative number handling", "1-indexed base-26 offset"],
      transfer: ["atoi, Add Strings", "Any simulation with carry"],
      problems: [
        P("plus-one", "Plus One", "Easy", "Propagate the carry from the right."),
        P("palindrome-number", "Palindrome Number", "Easy", "Reverse half the digits."),
        P("roman-to-integer", "Roman to Integer", "Easy", "Subtract when a smaller symbol precedes a larger."),
        P("reverse-integer", "Reverse Integer", "Medium", "Check overflow before appending a digit."),
        P("integer-to-roman", "Integer to Roman", "Medium", "Greedy over the value table."),
      ],
    },
    {
      id: "number-theory",
      name: "Primes, GCD & Cycle Detection on Numbers",
      signals: ["Count primes up to n", "Common divisor of strings or numbers", "Trailing zeros of a factorial", "Sequence that may loop forever (happy numbers)"],
      approach: "Sieve of Eratosthenes marks multiples starting at p². Euclid's gcd: gcd(a, b) = gcd(b, a % b). Trailing zeros = number of factors of 5. For digit-sum sequences, detect repetition with a set or fast/slow pointers.",
      template: `is_p = [True] * n
for p in range(2, int(n ** 0.5) + 1):
    if is_p[p]:
        for m in range(p * p, n, p): is_p[m] = False`,
      variations: ["Segmented sieve for large ranges", "Ugly numbers: DP with three pointers"],
      pitfalls: ["Count primes strictly less than n", "Overflow when squaring"],
      transfer: ["Linked-list cycle detection", "Modular arithmetic problems"],
      problems: [
        P("happy-number", "Happy Number", "Easy", "Fast/slow pointers on the digit-square sequence."),
        P("greatest-common-divisor-of-strings", "Greatest Common Divisor of Strings", "Easy", "gcd of lengths + concatenation check."),
        P("factorial-trailing-zeroes", "Factorial Trailing Zeroes", "Medium", "Sum n/5 + n/25 + ..."),
        P("count-primes", "Count Primes", "Medium", "Sieve of Eratosthenes."),
        P("ugly-number-ii", "Ugly Number II", "Medium", "Three pointers merging multiples of 2, 3, 5."),
      ],
    },
    {
      id: "randomization",
      name: "Randomization & Sampling",
      signals: ["Pick uniformly at random", "Weighted random choice", "Shuffle", "Sample from a stream of unknown length"],
      approach: "Weighted pick: prefix sums + binary search on a random number. Fisher–Yates shuffle swaps each position with a random index from the remaining. Reservoir sampling: keep the i-th item with probability 1/i. Rejection sampling builds rand10 from rand7.",
      variations: ["Alias method for O(1) weighted picks"],
      pitfalls: ["Biased shuffles (swap with any index instead of the remaining ones)", "Off-by-one in prefix search"],
      transfer: ["Insert Delete GetRandom O(1)", "Any 'uniform over unknown size' question"],
      problems: [
        P("shuffle-an-array", "Shuffle an Array", "Medium", "Fisher–Yates."),
        P("random-pick-with-weight", "Random Pick with Weight", "Medium", "Prefix sums + binary search."),
        P("linked-list-random-node", "Linked List Random Node", "Medium", "Reservoir sampling."),
        P("implement-rand10-using-rand7", "Implement Rand10() Using Rand7()", "Medium", "Rejection sampling over a 7×7 grid."),
      ],
    },
    {
      id: "geometry-slopes",
      name: "Geometry via Hashing Slopes",
      signals: ["Points on the same line", "Count collinear points or similar shapes"],
      approach: "For each anchor point, hash the reduced slope (dy/gcd, dx/gcd) to every other point; the largest bucket + 1 is the best line through the anchor. Avoid floating-point division.",
      variations: ["Normalize sign of the reduced slope"],
      pitfalls: ["Vertical lines (dx = 0)", "Duplicate points"],
      transfer: ["Any 'group by a canonical direction' problem"],
      problems: [P("max-points-on-a-line", "Max Points on a Line", "Hard", "Anchor point + reduced-slope counts.")],
    },
  ],
};

export const advancedDS: Topic = {
  id: "advanced-ds",
  name: "Design & Advanced Data Structures",
  blurb: "Combine primitives (hash map + list, heap + map) for O(1) operations; plus segment trees and Fenwick trees for dynamic range queries.",
  patterns: [
    {
      id: "cache-design",
      name: "Cache Design (LRU / LFU)",
      signals: ["Evict least recently / frequently used", "O(1) get and put", "Maintain order of access"],
      approach: "LRU: hash map from key to a node in a doubly linked list; move touched nodes to the front, evict from the back. LFU: map key → node plus map frequency → list, and track the current minimum frequency.",
      variations: ["OrderedDict / LinkedHashMap shortcuts (know how to build it by hand)", "All O`one: buckets of keys per count"],
      pitfalls: ["Sentinel head/tail nodes avoid null checks", "Update min-frequency when its list empties"],
      transfer: ["Browser history, undo stacks", "Time-based eviction"],
      problems: [
        P("lru-cache", "LRU Cache", "Medium", "Hash map + doubly linked list."),
        P("lfu-cache", "LFU Cache", "Hard", "Frequency buckets + min-frequency pointer."),
        P("all-oone-data-structure", "All O`one Data Structure", "Hard", "Linked list of count-buckets."),
      ],
    },
    {
      id: "hash-array-design",
      name: "Design with Hash Map + Array / Heap",
      signals: ["Design a class with several O(1) or O(log n) operations", "getRandom, timestamps, feeds, history"],
      approach: "List each operation's required complexity, then pick structures that give it: array + index map for random access with O(1) delete (swap with last), per-key sorted lists + binary search for time queries, heap merge for feeds.",
      variations: ["Chained buckets for a hash map", "Stack of URLs for history"],
      pitfalls: ["Delete from an array by swapping with the last element and updating the map"],
      transfer: ["System-design-lite follow-ups", "Rate limiters, leaderboards"],
      problems: [
        P("design-hashmap", "Design HashMap", "Easy", "Buckets with chaining."),
        P("design-browser-history", "Design Browser History", "Medium", "Array + current index (or two stacks)."),
        P("insert-delete-getrandom-o1", "Insert Delete GetRandom O(1)", "Medium", "Array + map; swap-delete."),
        P("time-based-key-value-store", "Time Based Key-Value Store", "Medium", "Per-key timestamps + binary search."),
        P("design-twitter", "Design Twitter", "Medium", "Merge the latest tweets with a heap."),
      ],
    },
    {
      id: "segment-fenwick",
      name: "Segment Tree & Fenwick Tree (BIT)",
      signals: ["Range queries with point updates", "Count of smaller elements to the right", "Offline counting with coordinate compression"],
      approach: "Fenwick: tree[i] covers (i − lowbit(i), i]; update adds up with i += i & −i, query sums down with i −= i & −i. Segment tree: recursive node stores aggregate of its range; both operations O(log n). Compress coordinates when values are large.",
      template: `def update(i, d):
    i += 1
    while i <= n: tree[i] += d; i += i & -i
def query(i):  # sum of [0, i)
    s = 0
    while i > 0: s += tree[i]; i -= i & -i
    return s`,
      variations: ["Lazy propagation for range updates", "Merge-sort counting as an alternative", "Sparse table for static range min"],
      pitfalls: ["1-indexing in Fenwick", "Rank-compress values before indexing"],
      transfer: ["Reverse Pairs / Count Smaller", "Skyline and calendar problems"],
      problems: [
        P("range-sum-query-mutable", "Range Sum Query - Mutable", "Medium", "Fenwick or segment tree."),
        P("count-of-smaller-numbers-after-self", "Count of Smaller Numbers After Self", "Hard", "Scan from the right with a BIT over ranks."),
        P("count-of-range-sum", "Count of Range Sum", "Hard", "Prefix sums + BIT / merge sort."),
        P("the-skyline-problem", "The Skyline Problem", "Hard", "Sweep with a max-heap of heights."),
      ],
    },
  ],
};

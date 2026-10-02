import { P, type Topic } from "./types";

export const backtracking: Topic = {
  id: "backtracking",
  name: "Recursion & Backtracking",
  blurb: "Build a solution one choice at a time, undo the choice, try the next. A DFS over the decision tree.",
  patterns: [
    {
      id: "subsets-combinations",
      transfer: ["Combination Sum I–IV, Combinations", "Subset XOR / partition into subsets", "Generate parentheses / binary strings", "Decision-tree enumeration of any 'choose items' problem"],
      name: "Subsets & Combinations (Include / Exclude)",
      signals: ["All subsets / combinations", "Choose k items; sum to target", "Order doesn't matter"],
      approach:
        "At each index decide include/exclude, or loop over candidates from a `start` index so earlier elements are never revisited (avoids permutations of the same set). Record the path at the right moment.",
      template: `def go(start, path):
    if goal(path): out.append(path[:]); return
    for i in range(start, n):
        if skip_dup(i, start): continue
        path.append(a[i]); go(i + 1, path); path.pop()`,
      variations: [
        "Reuse allowed → recurse with i, not i+1",
        "Duplicates in input → sort, then skip if a[i]==a[i-1] and i>start",
        "Prune when the running sum exceeds target (sort first)",
      ],
      pitfalls: ["Appending `path` instead of a copy", "Dedup condition `i > start`, not `i > 0`"],
      problems: [
        P("subsets", "Subsets", "Medium", "Every node of the decision tree is an answer."),
        P("combinations", "Combinations", "Medium", "Loop from start; stop at size k."),
        P("combination-sum", "Combination Sum", "Medium", "Unlimited reuse → recurse with the same index."),
        P("subsets-ii", "Subsets II", "Medium", "Sort + skip same value at the same depth."),
        P("combination-sum-ii", "Combination Sum II", "Medium", "Each used once + dedup at the same depth."),
      ],
    },
    {
      id: "permutations",
      transfer: ["Next Permutation (non-backtracking)", "Anagram permutations, string permutations with duplicates", "Permutation Sequence (k-th permutation)"],
      name: "Permutations (Used Array)",
      signals: ["All orderings / arrangements", "Order matters, use every element"],
      approach: "At each position, try every unused element. Track usage with a boolean array or swap elements into place.",
      template: `def go(path):
    if len(path) == n: out.append(path[:]); return
    for i in range(n):
        if used[i]: continue
        used[i] = True; path.append(a[i])
        go(path)
        path.pop(); used[i] = False`,
      variations: ["With duplicates: sort + skip a[i]==a[i-1] when a[i-1] unused", "Next permutation (non-backtracking)"],
      pitfalls: ["Forgetting to un-mark `used`"],
      problems: [
        P("permutations", "Permutations", "Medium", "Used-array backtracking."),
        P("permutations-ii", "Permutations II", "Medium", "Sort and skip repeated values at the same level."),
      ],
    },
    {
      id: "constraint-search",
      transfer: ["Sudoku Solver, Word Search II", "Partition to K Equal Sum Subsets", "Restore IP Addresses, Expression Add Operators", "Any puzzle with placement constraints"],
      name: "Constraint Search (Grid / String / Board)",
      signals: ["Place pieces under constraints", "Find a path in a grid without reuse", "Partition a string into valid parts", "Generate valid sequences"],
      approach: "Define state, choices, and a validity check that prunes early. Mark cells/positions as used, recurse, then unmark.",
      variations: [
        "Generate Parentheses: track open/close counts instead of validating after",
        "N-Queens: sets for columns and both diagonals (r−c, r+c)",
        "Palindrome partitioning: cut points + precomputed palindrome table",
      ],
      pitfalls: ["Late pruning → exponential blowup", "Not restoring grid cells after exploring"],
      problems: [
        P("letter-combinations-of-a-phone-number", "Letter Combinations of a Phone Number", "Medium", "One decision per digit."),
        P("generate-parentheses", "Generate Parentheses", "Medium", "Prune using open/close counts."),
        P("word-search", "Word Search", "Medium", "Mark visited, recurse in 4 directions, unmark."),
        P("palindrome-partitioning", "Palindrome Partitioning", "Medium", "Try every valid prefix cut."),
        P("n-queens", "N-Queens", "Hard", "Constant-time conflict check with 3 sets."),
      ],
    },
  ],
};

export const graphs: Topic = {
  id: "graphs",
  name: "Graphs",
  blurb: "Model the problem as nodes and edges, then pick the traversal: DFS, BFS, topo sort, union-find, or Dijkstra.",
  patterns: [
    {
      id: "grid-flood-fill",
      transfer: ["Flood Fill, Island Perimeter, Number of Closed Islands", "Shortest bridge (DFS then BFS)", "Region labelling and surrounded areas", "Multi-source BFS (rotting oranges, 01 matrix)"],
      name: "Grid DFS / BFS (Flood Fill)",
      signals: ["2D grid of land/water, 0/1, letters", "Count or measure connected regions", "Spread from the border or from sources"],
      approach:
        "Treat each cell as a node with 4 neighbours. Loop over all cells; when you hit an unvisited target cell, flood-fill it (DFS/BFS) and count/measure. For 'reachable from the border' flip the problem: start from the border and mark what's reachable.",
      template: `def dfs(r, c):
    if not (0 <= r < R and 0 <= c < C) or grid[r][c] != '1': return
    grid[r][c] = '0'
    for dr, dc in DIRS: dfs(r + dr, c + dc)`,
      variations: [
        "Multi-source BFS: push all sources first (Rotting Oranges)",
        "Reverse thinking: flood from the oceans/borders (Pacific Atlantic, Surrounded Regions)",
        "Mark visited in place vs. separate set",
      ],
      pitfalls: ["Recursion depth on large grids → use BFS", "Marking visited when popping instead of pushing → duplicates"],
      problems: [
        P("number-of-islands", "Number of Islands", "Medium", "One flood fill per component."),
        P("max-area-of-island", "Max Area of Island", "Medium", "Flood fill returns its size."),
        P("rotting-oranges", "Rotting Oranges", "Medium", "Multi-source BFS; levels = minutes."),
        P("surrounded-regions", "Surrounded Regions", "Medium", "Flood from the border to find the safe 'O's."),
        P("pacific-atlantic-water-flow", "Pacific Atlantic Water Flow", "Medium", "Flood uphill from each ocean, intersect."),
      ],
    },
    {
      id: "graph-traversal",
      transfer: ["Connected components in any relation graph", "Graph cloning / deep copy problems", "Detecting cycles in undirected graphs", "Word-relationship graphs (similar strings)"],
      name: "Graph Traversal & Cloning",
      signals: ["Adjacency list / edges given", "Count components, copy a graph, explore reachability"],
      approach: "Build the adjacency list. Keep a visited set (or old→new map for cloning) and DFS/BFS from each unvisited node.",
      variations: ["Clone with a hash map old → copy", "Components via DFS or union-find"],
      pitfalls: ["Forgetting visited → infinite loop on cycles", "Directed vs. undirected edge insertion"],
      problems: [
        P("number-of-provinces", "Number of Provinces", "Medium", "Count DFS launches over an adjacency matrix."),
        P("clone-graph", "Clone Graph", "Medium", "Map each original node to its clone."),
      ],
    },
    {
      id: "topological-sort",
      transfer: ["Alien Dictionary (premium), Sequence Reconstruction", "Build order and task scheduling", "Compile/dependency resolution", "DAG longest path / critical path"],
      name: "Topological Sort / Cycle in Directed Graph",
      signals: ["Prerequisites / dependencies / ordering", "Can all tasks be completed?", "Directed graph, detect a cycle"],
      approach:
        "Kahn's algorithm: compute indegrees, queue all indegree-0 nodes, pop one, decrement neighbours, queue newly zero ones. If you process fewer than n nodes there's a cycle. DFS alternative uses 3 colours.",
      template: `q = deque(v for v in range(n) if indeg[v] == 0)
order = []
while q:
    u = q.popleft(); order.append(u)
    for v in adj[u]:
        indeg[v] -= 1
        if indeg[v] == 0: q.append(v)
return len(order) == n`,
      variations: ["Return the order (Course Schedule II)", "Peel leaves repeatedly (tree centres / Minimum Height Trees)"],
      pitfalls: ["Edge direction (prereq → course)"],
      problems: [
        P("course-schedule", "Course Schedule", "Medium", "Feasible iff topological order covers all nodes."),
        P("course-schedule-ii", "Course Schedule II", "Medium", "Return the Kahn order."),
        P("minimum-height-trees", "Minimum Height Trees", "Medium", "Peel leaves layer by layer."),
      ],
    },
    {
      id: "union-find",
      transfer: ["Number of Islands II (online)", "Accounts Merge, Smallest String With Swaps", "Kruskal's MST", "Detect cycle in undirected graph"],
      name: "Union-Find (Disjoint Set)",
      signals: ["Dynamic connectivity", "Merge groups", "Detect a cycle in an undirected graph / redundant edge"],
      approach: "find(x) with path compression, union(a, b) by rank/size. If find(a)==find(b) before union, the edge closes a cycle.",
      template: `def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x`,
      variations: ["Union by key (emails → account owner)", "Track component count / size"],
      pitfalls: ["Union the roots, not the raw nodes"],
      problems: [
        P("redundant-connection", "Redundant Connection", "Medium", "First edge whose endpoints are already connected."),
        P("accounts-merge", "Accounts Merge", "Medium", "Union emails sharing an account."),
      ],
    },
    {
      id: "shortest-path",
      transfer: ["Grid shortest path with costs", "Minimum effort / bottleneck paths", "Cheapest flights with at most K stops", "Word Ladder style state graphs"],
      name: "Shortest Path (BFS / Dijkstra)",
      signals: ["Minimum steps / transformations (unweighted → BFS)", "Weighted edges, non-negative → Dijkstra", "At most K stops → state includes k"],
      approach:
        "Unweighted: BFS level = distance. Weighted: Dijkstra with a min-heap of (dist, node), skipping stale entries. If extra state matters (stops, keys), put it in the node.",
      template: `dist = {src: 0}; h = [(0, src)]
while h:
    d, u = heappop(h)
    if d > dist.get(u, inf): continue
    for v, w in adj[u]:
        if d + w < dist.get(v, inf):
            dist[v] = d + w; heappush(h, (d + w, v))`,
      variations: ["Minimax (min of max edge) = Dijkstra with max()", "Bellman-Ford for ≤ K edges", "Word-ladder: generate neighbours via wildcard buckets"],
      pitfalls: ["Dijkstra fails with negative edges", "Skipping the stale-entry check"],
      problems: [
        P("word-ladder", "Word Ladder", "Hard", "BFS over words, neighbours differ by one letter."),
        P("network-delay-time", "Network Delay Time", "Medium", "Dijkstra; answer = max distance."),
        P("path-with-minimum-effort", "Path With Minimum Effort", "Medium", "Dijkstra where cost is the max step."),
        P("cheapest-flights-within-k-stops", "Cheapest Flights Within K Stops", "Medium", "State is (node, stops used)."),
      ],
    },
  ],
};

export const dp: Topic = {
  id: "dp",
  name: "Dynamic Programming",
  blurb: "Overlapping subproblems + optimal substructure. Define the state, the transition, and the base case.",
  patterns: [
    {
      id: "dp-1d-linear",
      subtopic: "Linear & Knapsack",
      transfer: ["Fibonacci-style counting (stairs, tilings)", "Max sum with non-adjacent constraint", "Decode Ways, Delete and Earn", "Minimum cost to reach the end"],
      name: "1D Linear (Take / Skip)",
      signals: ["Best result up to index i", "Choose or skip each element with an adjacency rule", "Count ways to reach step n"],
      approach: "dp[i] depends on a few previous states, e.g. dp[i] = max(dp[i-1], dp[i-2] + a[i]). Roll the array to O(1) space once it works.",
      template: `prev2, prev1 = 0, 0
for x in a:
    prev2, prev1 = prev1, max(prev1, prev2 + x)
return prev1`,
      variations: ["Circular arrangement: solve twice excluding first / last", "Decode Ways: dp over 1- and 2-character tokens"],
      pitfalls: ["Base cases and leading zeros in Decode Ways"],
      problems: [
        P("climbing-stairs", "Climbing Stairs", "Easy", "Fibonacci in disguise."),
        P("min-cost-climbing-stairs", "Min Cost Climbing Stairs", "Easy", "dp[i] = cost[i] + min of two previous."),
        P("house-robber", "House Robber", "Medium", "Take (skip previous) or skip."),
        P("house-robber-ii", "House Robber II", "Medium", "Two linear runs for a circle."),
        P("decode-ways", "Decode Ways", "Medium", "Add ways from valid 1- and 2-digit tokens."),
      ],
    },
    {
      id: "dp-knapsack-unbounded",
      subtopic: "Linear & Knapsack",
      transfer: ["Coin Change I/II, Perfect Squares", "Word Break, Combination Sum IV", "Minimum number of items to hit a target"],
      name: "Unbounded Knapsack / Coin Style",
      signals: ["Reuse items unlimited times", "Min coins / number of ways to make an amount", "Can a string be segmented into dictionary words?"],
      approach:
        "dp[a] = best using coins for amount a. Min coins: dp[a] = min(dp[a-c]+1). Count ways: loop coins on the outside, amounts inside, so order doesn't matter (combinations). Swap the loops to count permutations.",
      template: `dp = [0] + [INF] * amount
for a in range(1, amount + 1):
    for c in coins:
        if a >= c: dp[a] = min(dp[a], dp[a - c] + 1)`,
      variations: ["Word Break: dp[i] = any(dp[j] and s[j:i] in dict)"],
      pitfalls: ["Loop order determines combinations vs. permutations", "INF overflow in the min"],
      problems: [
        P("coin-change", "Coin Change", "Medium", "Min over dp[a − c] + 1."),
        P("coin-change-ii", "Coin Change II", "Medium", "Coins outer loop → counts combinations."),
        P("word-break", "Word Break", "Medium", "dp[i] true if some dp[j] and s[j:i] is a word."),
      ],
    },
    {
      id: "dp-knapsack-01",
      subtopic: "Linear & Knapsack",
      transfer: ["Subset Sum, Partition Equal Subset Sum", "Target Sum, Last Stone Weight II", "Ones and Zeroes (2D knapsack)", "Minimum difference of two partitions"],
      name: "0/1 Knapsack / Subset Sum",
      signals: ["Each item used at most once", "Partition into two equal-sum subsets", "Assign +/- signs to reach a target"],
      approach: "dp[s] = can we form sum s. Iterate items outer; iterate sums *downwards* so each item is used once. Reduce other problems to a subset-sum target first (e.g. (total+target)/2).",
      template: `dp = [True] + [False] * target
for x in nums:
    for s in range(target, x - 1, -1):
        dp[s] = dp[s] or dp[s - x]`,
      variations: ["Count subsets instead of boolean", "Minimize difference of two partitions"],
      pitfalls: ["Iterating sums upwards silently turns it into unbounded knapsack"],
      problems: [
        P("partition-equal-subset-sum", "Partition Equal Subset Sum", "Medium", "Subset sum to total/2."),
        P("target-sum", "Target Sum", "Medium", "Reduce signs to a subset-sum count."),
        P("last-stone-weight-ii", "Last Stone Weight II", "Medium", "Minimize the difference between two subset sums."),
      ],
    },
    {
      id: "dp-kadane-lis",
      subtopic: "Subarray & Subsequence",
      transfer: ["Max subarray in circular array, max sum with one deletion", "Longest Increasing Subsequence variants (envelopes, chains)", "Best-ending-here problems in general"],
      name: "Subarray (Kadane) & Subsequence (LIS)",
      signals: ["Max sum / product of a contiguous subarray", "Longest increasing subsequence", "State = best ending at i"],
      approach:
        "Define dp[i] as the best answer *ending* at i. Kadane: cur = max(x, cur + x). Product needs both max and min ending here (sign flips). LIS: dp[i] = 1 + max(dp[j]) over j<i with a[j]<a[i]; O(n log n) with patience sorting.",
      template: `cur = best = a[0]
for x in a[1:]:
    cur = max(x, cur + x)
    best = max(best, cur)`,
      variations: ["Track min and max for products", "LIS via binary search on tails"],
      pitfalls: ["Answer is the max over all i, not dp[n-1]"],
      problems: [
        P("maximum-subarray", "Maximum Subarray", "Medium", "Extend or restart."),
        P("maximum-product-subarray", "Maximum Product Subarray", "Medium", "Keep running max and min."),
        P("longest-increasing-subsequence", "Longest Increasing Subsequence", "Medium", "dp ending at i, then optimize with tails + bisect."),
      ],
    },
    {
      id: "dp-grid",
      subtopic: "Grid & Strings",
      transfer: ["Unique Paths with obstacles, Minimum Path Sum", "Maximal Square / count squares", "Cherry Pickup, Dungeon Game", "Triangle and falling path problems"],
      name: "2D Grid DP",
      signals: ["Paths from top-left to bottom-right", "Move only right/down", "Largest square / min path cost"],
      approach: "dp[r][c] from dp[r-1][c], dp[r][c-1] (and diagonal for squares). Compress to one row once correct.",
      variations: ["Obstacles → set dp to 0", "Maximal Square: min of three neighbours + 1"],
      pitfalls: ["Initialize first row and column"],
      problems: [
        P("unique-paths", "Unique Paths", "Medium", "Sum of top and left."),
        P("minimum-path-sum", "Minimum Path Sum", "Medium", "Cost + min(top, left)."),
        P("maximal-square", "Maximal Square", "Medium", "1 + min(top, left, diagonal)."),
      ],
    },
    {
      id: "dp-two-strings",
      subtopic: "Grid & Strings",
      transfer: ["Edit Distance, Longest Common Subsequence", "Shortest Common Supersequence", "Delete operations for two strings", "Interleaving String, Distinct Subsequences"],
      name: "Two-String DP (Edit / LCS)",
      signals: ["Compare or transform two strings/sequences", "Longest common subsequence", "Minimum operations to convert A to B"],
      approach:
        "dp[i][j] is the answer for prefixes a[:i], b[:j]. If a[i-1]==b[j-1], extend the diagonal; otherwise take the best of dropping/editing one side.",
      template: `for i in range(1, m+1):
    for j in range(1, n+1):
        if a[i-1] == b[j-1]: dp[i][j] = dp[i-1][j-1] + 1
        else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])`,
      variations: ["Edit distance: insert / delete / replace = 1 + min of three", "Distinct Subsequences counts matches"],
      pitfalls: ["Row 0 / column 0 base cases (empty string)"],
      problems: [
        P("longest-common-subsequence", "Longest Common Subsequence", "Medium", "Match → diagonal + 1; else max of the other two."),
        P("edit-distance", "Edit Distance", "Medium", "Three operations map to three neighbours."),
        P("distinct-subsequences", "Distinct Subsequences", "Hard", "Count ways: use or skip a matching char."),
      ],
    },
    {
      id: "dp-expand-center",
      subtopic: "Grid & Strings",
      transfer: ["Count palindromic substrings", "Longest palindromic subsequence (interval DP)", "Manacher's algorithm for linear time"],
      name: "Palindromes (Expand Around Centre / Interval)",
      signals: ["Longest or count of palindromic substrings"],
      approach: "Every palindrome has a centre (n odd centres + n-1 even centres). Expand outward while chars match: O(n²), O(1) space. Or dp[i][j] = s[i]==s[j] and dp[i+1][j-1].",
      variations: ["Manacher's algorithm for O(n)"],
      pitfalls: ["Forgetting even-length centres"],
      problems: [
        P("longest-palindromic-substring", "Longest Palindromic Substring", "Medium", "Expand from each centre."),
        P("palindromic-substrings", "Palindromic Substrings", "Medium", "Count successful expansions."),
      ],
    },
    {
      id: "dp-state-machine",
      subtopic: "Advanced states",
      transfer: ["Stock problems with cooldown/fee/k transactions", "Paint House (colour state)", "Any problem where the previous 'mode' constrains the next move"],
      name: "State Machine DP",
      signals: ["Buy/sell with cooldown or fee", "Different 'modes' you can be in at each step"],
      approach: "Name the states (hold, sold, rest). Write each state's value at day i from the previous day's states. Iterate once keeping only the previous values.",
      variations: ["Limit on transactions k adds a dimension"],
      pitfalls: ["Drawing the state transition diagram first prevents sign errors"],
      problems: [P("best-time-to-buy-and-sell-stock-with-cooldown", "Best Time to Buy and Sell Stock with Cooldown", "Medium", "Three states: hold, sold, rest.")],
    },
  ],
};

export const greedyIntervals: Topic = {
  id: "greedy-intervals",
  name: "Greedy & Intervals",
  blurb: "Make the locally best choice and prove it never hurts — usually after sorting.",
  patterns: [
    {
      id: "intervals",
      transfer: ["Meeting Rooms I/II, Employee Free Time", "Merge with new interval, Summary Ranges", "Minimum arrows / activity selection", "Calendar booking problems"],
      name: "Sort & Sweep Intervals",
      signals: ["Merge / insert / remove overlapping intervals", "Minimum removals or arrows", "Meeting-room style overlap"],
      approach:
        "Sort by start (to merge) or by end (to maximize non-overlapping picks). Sweep once, comparing the current interval with the last kept one.",
      template: `intervals.sort()
out = [intervals[0]]
for s, e in intervals[1:]:
    if s <= out[-1][1]: out[-1][1] = max(out[-1][1], e)
    else: out.append([s, e])`,
      variations: ["Sort by end for activity selection", "Sweep line over +1/−1 events for max concurrency"],
      pitfalls: ["Touching intervals: ≤ vs. <", "Sorting by the wrong endpoint"],
      problems: [
        P("merge-intervals", "Merge Intervals", "Medium", "Sort by start; extend the last interval."),
        P("insert-interval", "Insert Interval", "Medium", "Three phases: before, overlapping, after."),
        P("non-overlapping-intervals", "Non-overlapping Intervals", "Medium", "Sort by end, keep the earliest-ending."),
        P("minimum-number-of-arrows-to-burst-balloons", "Minimum Number of Arrows to Burst Balloons", "Medium", "Same as max non-overlapping."),
      ],
    },
    {
      id: "greedy-choice",
      transfer: ["Jump Game I/II, Gas Station", "Minimum platforms, task scheduling", "Partition Labels, Buy/Sell Stock II", "Candy, Wiggle subsequence"],
      name: "Greedy Choice / Reachability",
      signals: ["Maximize reach, minimize steps", "Local choice seems obviously safe", "Single pass with running best"],
      approach: "Maintain the furthest reachable position (or running total) and update as you scan. Prove the greedy by an exchange argument: swapping to any other choice can't improve the result.",
      variations: ["Jump Game II: BFS-like levels via current and farthest end", "Gas Station: reset the start when the tank goes negative", "Partition Labels: extend to the last occurrence"],
      pitfalls: ["Greedy that 'feels right' but fails on a counter-example — test small cases"],
      problems: [
        P("best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock", "Easy", "Track the min price so far."),
        P("best-time-to-buy-and-sell-stock-ii", "Best Time to Buy and Sell Stock II", "Medium", "Sum all positive differences."),
        P("jump-game", "Jump Game", "Medium", "Track the furthest reachable index."),
        P("jump-game-ii", "Jump Game II", "Medium", "Jump when you hit the current window's end."),
        P("gas-station", "Gas Station", "Medium", "If the tank goes negative, restart after that station."),
        P("partition-labels", "Partition Labels", "Medium", "Cut when i reaches the farthest last-occurrence."),
      ],
    },
  ],
};

export const triesBits: Topic = {
  id: "tries-bits",
  name: "Tries & Bit Manipulation",
  blurb: "Specialised tools: prefix trees for string sets, bit tricks for O(1) space and arithmetic.",
  patterns: [
    {
      id: "trie",
      transfer: ["Autocomplete, spell-check", "Longest common prefix of many strings", "Word Search II, Replace Words", "Maximum XOR (binary trie)"],
      name: "Trie (Prefix Tree)",
      signals: ["Many words with prefix queries", "Autocomplete / dictionary / wildcard search", "Search many words in a grid"],
      approach:
        "Each node has children keyed by character and an end-of-word flag. Insert/search walk one character per step. For grid word search, DFS the grid while walking the trie so shared prefixes are explored once, and prune exhausted branches.",
      template: `node = root
for ch in word:
    node = node.children.setdefault(ch, Node())
node.end = True`,
      variations: ["'.' wildcard → branch over all children", "Store the full word at the end node"],
      pitfalls: ["Prefix match vs. full-word match need the end flag"],
      problems: [
        P("implement-trie-prefix-tree", "Implement Trie (Prefix Tree)", "Medium", "Insert, search, startsWith."),
        P("design-add-and-search-words-data-structure", "Design Add and Search Words Data Structure", "Medium", "DFS on '.'."),
        P("word-search-ii", "Word Search II", "Hard", "Backtracking guided by a trie."),
      ],
    },
    {
      id: "bits",
      transfer: ["Subset enumeration with masks", "Bitmask DP (TSP, assignments)", "Parity/flag compression", "Counting set bits, power-of-two checks"],
      name: "Bit Tricks (XOR, Masks, Counting)",
      signals: ["Find the element that appears an odd number of times", "O(1) space with integers", "Sum without + / powers of two / subsets as masks"],
      approach:
        "XOR cancels pairs (a^a=0, a^0=a). n & (n-1) clears the lowest set bit. n & -n isolates it. Shifts and masks inspect bits. DP on bits: bits[i] = bits[i>>1] + (i&1).",
      variations: ["Missing number via XOR of indices and values", "Add without + using XOR (sum) and AND<<1 (carry)"],
      pitfalls: ["Signed shifts and 32-bit overflow in Python vs. Java/C++"],
      problems: [
        P("single-number", "Single Number", "Easy", "XOR everything."),
        P("number-of-1-bits", "Number of 1 Bits", "Easy", "Clear the lowest set bit each loop."),
        P("missing-number", "Missing Number", "Easy", "XOR indices with values."),
        P("counting-bits", "Counting Bits", "Easy", "bits[i] = bits[i >> 1] + (i & 1)."),
        P("sum-of-two-integers", "Sum of Two Integers", "Medium", "XOR is sum without carry; AND<<1 is carry."),
      ],
    },
  ],
};

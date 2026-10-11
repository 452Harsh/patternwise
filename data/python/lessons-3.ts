import type { PyLesson } from "./types";

export const lessons3: PyLesson[] = [
  /* ------------------------------------------------------------------ */
  {
    id: "binary-search",
    title: "Binary search",
    cpp: "lower_bound / upper_bound",
    py: "bisect",
    behavesLike: "lower_bound / upper_bound on a sorted vector",
    summary: "`bisect_left` is `lower_bound`, `bisect_right` is `upper_bound`, and both return indices, not iterators.",
    concept: [
      "The `bisect` module does binary search on a sorted list. `bisect_left(a, x)` is `lower_bound` (first index with `a[i] >= x`), and `bisect_right(a, x)` is `upper_bound` (first index with `a[i] > x`).",
      "They return integer indices, so there's no iterator arithmetic. `insort(a, x)` inserts while keeping the list sorted (O(n) because of the shift).",
      "For \"binary search on the answer\" problems you still write the loop yourself. Python ints don't overflow, so `(lo + hi) // 2` is safe.",
    ],
    compare: [
      {
        label: "lower_bound / upper_bound",
        cpp: `auto it = lower_bound(a.begin(), a.end(), x);
int i = it - a.begin();
int j = upper_bound(a.begin(), a.end(), x) - a.begin();
int cnt = j - i;          // occurrences of x
bool found = binary_search(a.begin(), a.end(), x);`,
        py: `from bisect import bisect_left, bisect_right
i = bisect_left(a, x)
j = bisect_right(a, x)
cnt = j - i               # occurrences of x
found = i < len(a) and a[i] == x`,
      },
      {
        label: "Manual loop",
        cpp: `int lo = 0, hi = n - 1;
while (lo <= hi) {
  int mid = lo + (hi - lo) / 2;
  if (a[mid] == t) return mid;
  if (a[mid] < t) lo = mid + 1; else hi = mid - 1;
}`,
        py: `lo, hi = 0, len(a) - 1
while lo <= hi:
    mid = (lo + hi) // 2      # no overflow in Python
    if a[mid] == t:
        return mid
    if a[mid] < t:
        lo = mid + 1
    else:
        hi = mid - 1`,
      },
    ],
    differences: [
      "Use `//` for integer division. `/` always returns a float, and `a[mid]` with a float index raises `TypeError`.",
      "`bisect` functions take optional `lo` and `hi` bounds, and (since Python 3.10) a `key=` function.",
      "There's no `binary_search`; check `i < len(a) and a[i] == x` after `bisect_left`.",
      "`bisect` on a descending list gives wrong answers. Search a negated copy or write the loop.",
      "Python has no built-in sorted set/map. On LeetCode, `from sortedcontainers import SortedList` gives `std::multiset`-like behaviour with `bisect_left`, `add` and `remove` in O(log n).",
    ],
    examples: [
      {
        title: "bisect in action",
        code: `from bisect import bisect_left, bisect_right, insort

a = [1, 2, 2, 2, 5, 7]
print(bisect_left(a, 2))    # 1   first 2
print(bisect_right(a, 2))   # 4   one past the last 2
print(bisect_left(a, 3))    # 4   where 3 would go
print(bisect_left(a, 9))    # 6   == len(a): not found

insort(a, 4)                # a = [1, 2, 2, 2, 4, 5, 7]`,
      },
      {
        title: "Binary search on the answer",
        code: `def min_capacity(weights, days):
    """Smallest ship capacity that ships everything within 'days' days."""
    def feasible(cap):
        need, load = 1, 0
        for w in weights:
            if load + w > cap:
                need += 1
                load = 0
            load += w
        return need <= days

    lo, hi = max(weights), sum(weights)
    while lo < hi:                # find the first True
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo

print(min_capacity([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5))   # 15`,
      },
    ],
    complexity: [
      { op: "bisect_left / bisect_right", code: "bisect_left(a, x)", time: "O(log n)" },
      { op: "insort", code: "insort(a, x)", time: "O(n)", note: "Search O(log n), shift O(n)" },
      { op: "Manual binary search", code: "while lo <= hi", time: "O(log n)" },
      { op: "Search on answer", code: "feasible(mid)", time: "O(log range × check)" },
      { op: "SortedList add / remove", code: "sl.add(x)", time: "O(log n)", note: "sortedcontainers" },
    ],
    choose: [
      "Sorted list, find position / count / nearest → `bisect`.",
      "Sorted collection that changes a lot → `SortedList` (LeetCode) or a heap if you only need the min/max.",
      "Monotonic yes/no condition over a numeric range → hand-written \"first True\" loop.",
    ],
    useCases: ["Search in sorted arrays", "First / last position of a value", "Search in rotated arrays", "Binary search on the answer (capacity, speed, time)", "Longest increasing subsequence (patience sorting)"],
    leetcode: [
      { title: "Binary Search", slug: "binary-search" },
      { title: "Find First and Last Position of Element in Sorted Array", slug: "find-first-and-last-position-of-element-in-sorted-array" },
      { title: "Koko Eating Bananas", slug: "koko-eating-bananas" },
      { title: "Search in Rotated Sorted Array", slug: "search-in-rotated-sorted-array" },
    ],
    mistakes: [
      "Writing `mid = (lo + hi) / 2`: that's a float. Use `//`.",
      "Treating `bisect_left`'s result as \"found\" without checking `a[i] == x` and `i < len(a)`.",
      "Using `bisect` on unsorted or descending data.",
      "Using `insort` in a loop over n items (O(n²)) when one sort at the end would do.",
      "Ceil division with floats: `math.ceil(a / b)` can be off for huge ints. Use `(a + b - 1) // b` or `-(-a // b)`.",
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "linked-lists-trees",
    title: "Linked lists and trees",
    cpp: "struct ListNode* / TreeNode*",
    py: "class with attributes",
    behavesLike: "pointer-based nodes, with None as nullptr",
    summary: "Nodes are small classes; `None` is `nullptr`. Recursion and `deque` cover most tree problems.",
    concept: [
      "On LeetCode, `ListNode` and `TreeNode` are tiny classes with `val` and `next` / `left` / `right` attributes. Every Python variable is already a reference, so there's no `*` or `->`: write `node.next`.",
      "`None` plays the role of `nullptr`, and `if node:` / `if not node:` is the usual null check.",
      "Memory is garbage-collected, so you never `delete` nodes. A dummy head node is still the cleanest way to build lists.",
      "Python's default recursion limit is about 1000 frames, so deep recursion on a skewed tree or long list can raise `RecursionError`. Use an iterative version or `sys.setrecursionlimit` when depth can be large.",
    ],
    compare: [
      {
        label: "Node definitions",
        cpp: `struct ListNode {
  int val; ListNode* next;
  ListNode(int x) : val(x), next(nullptr) {}
};
struct TreeNode {
  int val; TreeNode *left, *right;
};`,
        py: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right`,
      },
      {
        label: "Traverse a list",
        cpp: `for (ListNode* cur = head; cur; cur = cur->next)
  cout << cur->val;`,
        py: `cur = head
while cur:
    print(cur.val)
    cur = cur.next`,
      },
      {
        label: "Recursive tree",
        cpp: `int depth(TreeNode* r) {
  if (!r) return 0;
  return 1 + max(depth(r->left), depth(r->right));
}`,
        py: `def depth(root):
    if not root:
        return 0
    return 1 + max(depth(root.left), depth(root.right))`,
      },
    ],
    differences: [
      "No pointers or `->`. Attribute access is always `.`.",
      "Compare nodes by identity with `is` / `is not` (`slow is fast`), values with `==`.",
      "Use `nonlocal` to update an outer variable from a nested helper (for example a running max in tree DP).",
      "Tuple assignment makes pointer rewiring a one-liner: `prev, cur.next, cur = cur, prev, cur.next` (order matters; write it as separate lines until you're comfortable).",
      "Use `float('inf')` / `float('-inf')` (or `math.inf`) for unbounded min/max, instead of `INT_MAX` / `LLONG_MIN`.",
    ],
    examples: [
      {
        title: "Build, print and reverse a list",
        code: `def build(vals):
    dummy = tail = ListNode()
    for v in vals:
        tail.next = ListNode(v)
        tail = tail.next
    return dummy.next

def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out

def reverse(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev, cur = cur, nxt
    return prev

print(to_list(reverse(build([1, 2, 3]))))   # [3, 2, 1]`,
      },
      {
        title: "Tree traversals: recursive and level-order",
        code: `from collections import deque

def inorder(root):
    return inorder(root.left) + [root.val] + inorder(root.right) if root else []

def level_order(root):
    if not root:
        return []
    res, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        res.append(level)
    return res`,
      },
      {
        title: "nonlocal for tree DP (diameter)",
        code: `def diameter(root):
    best = 0

    def height(node):
        nonlocal best
        if not node:
            return 0
        l, r = height(node.left), height(node.right)
        best = max(best, l + r)
        return 1 + max(l, r)

    height(root)
    return best`,
      },
    ],
    complexity: [
      { op: "Access next / child", code: "node.next, node.left", time: "O(1)" },
      { op: "Traverse a list", code: "while cur:", time: "O(n)" },
      { op: "DFS / BFS on a tree", code: "recursion / deque", time: "O(n)", note: "Space O(h) / O(width)" },
      { op: "BST search / insert", code: "go left or right", time: "O(h)", note: "O(log n) if balanced" },
      { op: "Recursion depth limit", code: "sys.getrecursionlimit()", time: "≈1000 frames" },
    ],
    choose: [
      "Problem gives you `ListNode` / `TreeNode` → work with the nodes directly.",
      "Easier to solve on an array → copy values into a list first (O(n) extra space) and say so.",
      "Level-by-level → BFS with `deque`. Path / subtree aggregates → recursive DFS.",
    ],
    useCases: ["Reverse / merge / reorder lists", "Fast and slow pointers (cycles, middle)", "Tree depth, diameter, paths", "BST validation and search", "Level-order traversal"],
    leetcode: [
      { title: "Reverse Linked List", slug: "reverse-linked-list" },
      { title: "Linked List Cycle", slug: "linked-list-cycle" },
      { title: "Binary Tree Level Order Traversal", slug: "binary-tree-level-order-traversal" },
      { title: "Validate Binary Search Tree", slug: "validate-binary-search-tree" },
    ],
    mistakes: [
      "Writing `node->next` or checking `node == NULL`. Use `node.next` and `node is None` / `not node`.",
      "Using a mutable default argument: `def f(node, path=[])` shares the same list across calls. Use `path=None` and create it inside.",
      "Assigning to an outer variable inside a nested function without `nonlocal` (it creates a new local instead).",
      "Using `INT_MIN`-style sentinels like `-2**31` for BST bounds; values can equal them. Use `float('-inf')`.",
      "Recursing on a 10⁵-node skewed tree and hitting `RecursionError`.",
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "graphs",
    title: "Graphs",
    cpp: "vector<vector<int>> adj",
    py: "defaultdict(list) / list of lists",
    behavesLike: "adjacency list + visited set",
    summary: "Adjacency lists in a `defaultdict(list)` or `[[] for _ in range(n)]`, a set for visited, `deque` for BFS, `heapq` for Dijkstra.",
    concept: [
      "Graphs are built from what you already know: a list or dict for the adjacency list, a set (or boolean list) for visited, a `deque` for BFS, a list or recursion for DFS, and `heapq` for Dijkstra.",
      "When nodes are `0..n-1`, use `adj = [[] for _ in range(n)]` (like `vector<vector<int>>`). When nodes are strings or sparse, use `defaultdict(list)`.",
      "Grids are implicit graphs: neighbours are `(r + dr, c + dc)` within bounds, and visited cells are tuples in a set (or mark the grid in place).",
    ],
    compare: [
      {
        label: "Build an adjacency list",
        cpp: `vector<vector<int>> adj(n);
for (auto& e : edges) {
  adj[e[0]].push_back(e[1]);
  adj[e[1]].push_back(e[0]);
}`,
        py: `adj = [[] for _ in range(n)]
for u, v in edges:
    adj[u].append(v)
    adj[v].append(u)

# Non-integer nodes:
from collections import defaultdict
adj = defaultdict(list)`,
      },
      {
        label: "Recursive DFS",
        cpp: `vector<bool> vis(n);
function<void(int)> dfs = [&](int u) {
  vis[u] = true;
  for (int v : adj[u]) if (!vis[v]) dfs(v);
};`,
        py: `visited = set()

def dfs(u):
    visited.add(u)
    for v in adj[u]:
        if v not in visited:
            dfs(v)`,
      },
      {
        label: "Dijkstra",
        cpp: `vector<int> dist(n, INT_MAX);
priority_queue<pii, vector<pii>, greater<pii>> pq;
dist[s] = 0; pq.push({0, s});
while (!pq.empty()) {
  auto [d, u] = pq.top(); pq.pop();
  if (d > dist[u]) continue;
  for (auto [v, w] : adj[u])
    if (d + w < dist[v]) { dist[v] = d + w; pq.push({dist[v], v}); }
}`,
        py: `dist = [float("inf")] * n
dist[s] = 0
pq = [(0, s)]
while pq:
    d, u = heapq.heappop(pq)
    if d > dist[u]:
        continue
    for v, w in adj[u]:
        if d + w < dist[v]:
            dist[v] = d + w
            heapq.heappush(pq, (dist[v], v))`,
      },
    ],
    differences: [
      "Nested functions can read outer variables (like a C++ lambda capturing by reference), but need `nonlocal` to reassign them.",
      "Recursive DFS on a 10⁵-node path hits the ~1000 recursion limit. Use an explicit stack, or `sys.setrecursionlimit(10**6)` for moderate depths.",
      "`[[]] * n` gives n references to one list (the same trap as 2D grids). Use `[[] for _ in range(n)]`.",
      "For 0-indexed nodes, a `visited = [False] * n` list is slightly faster than a set; a set is more flexible.",
      "`functools.cache` on a DFS helper gives memoised DFS (DAG DP) in one line.",
    ],
    examples: [
      {
        title: "Count connected components (BFS)",
        code: `from collections import deque

def count_components(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)

    seen = [False] * n
    comps = 0
    for s in range(n):
        if seen[s]:
            continue
        comps += 1
        seen[s] = True
        q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if not seen[v]:
                    seen[v] = True
                    q.append(v)
    return comps

print(count_components(5, [[0, 1], [1, 2], [3, 4]]))   # 2`,
      },
      {
        title: "Topological sort (Kahn's algorithm)",
        code: `from collections import deque

def topo_order(n, edges):          # edge u -> v
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []   # [] means a cycle`,
      },
      {
        title: "Union-Find (DSU)",
        code: `n = 5
parent = list(range(n))

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]   # path halving
        x = parent[x]
    return x

def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb:
        return False
    parent[ra] = rb
    return True`,
      },
    ],
    complexity: [
      { op: "Build adjacency list", code: "adj[u].append(v)", time: "O(V + E)" },
      { op: "BFS / DFS", code: "deque / stack / recursion", time: "O(V + E)" },
      { op: "Topological sort", code: "Kahn's with deque", time: "O(V + E)" },
      { op: "Dijkstra", code: "heapq", time: "O((V + E) log V)" },
      { op: "Union-Find", code: "find / union", time: "≈ O(α(n)) with path compression" },
    ],
    choose: [
      "Shortest path, unweighted → BFS with `deque`.",
      "Shortest path, non-negative weights → Dijkstra with `heapq`.",
      "Connectivity / cycle in undirected graph → DFS, BFS or Union-Find.",
      "Dependencies / ordering → topological sort (Kahn's).",
      "Grid → implicit graph with direction tuples.",
    ],
    useCases: ["Islands / flood fill", "Course schedule (cycle detection)", "Shortest path (BFS, Dijkstra)", "Clone graph", "Connected components / Union-Find"],
    leetcode: [
      { title: "Number of Islands", slug: "number-of-islands" },
      { title: "Course Schedule", slug: "course-schedule" },
      { title: "Clone Graph", slug: "clone-graph" },
      { title: "Network Delay Time", slug: "network-delay-time" },
    ],
    mistakes: [
      "`adj = [[]] * n`, which makes every node share one neighbour list.",
      "Marking visited on pop in BFS, so nodes get queued many times.",
      "Deep recursive DFS without raising the recursion limit (or going iterative).",
      "Forgetting the `if d > dist[u]: continue` stale-entry check in Dijkstra.",
      "Using `float('inf')` and then returning it where an int is expected; convert or check first.",
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "tools",
    title: "Built-in tools for DSA",
    cpp: "<algorithm>, <numeric>",
    py: "builtins + collections + itertools",
    behavesLike: "the STL algorithms header, but shorter",
    summary: "`enumerate`, `zip`, `range`, `sorted`, `sum`, `any`, `all`, `Counter` and `defaultdict` replace most hand-written loops.",
    concept: [
      "Much of what you'd write as a loop or an `<algorithm>` call in C++ is a built-in in Python. Knowing these makes solutions shorter and easier to get right under interview pressure.",
      "`Counter` is a dict that counts: missing keys read as 0, and it has `most_common(k)`. `defaultdict(factory)` creates a default value on first access.",
      "Most built-ins take any iterable, including generator expressions, so `sum(x * x for x in a)` doesn't build an intermediate list.",
    ],
    compare: [
      {
        label: "Loops",
        cpp: `for (int i = 0; i < n; i++) ...
for (int i = n - 1; i >= 0; i--) ...
for (int i = 0; i < n; i++) f(i, a[i]);
for (int i = 0; i < n; i++) g(a[i], b[i]);`,
        py: `for i in range(n): ...
for i in range(n - 1, -1, -1): ...   # or reversed(range(n))
for i, x in enumerate(a): f(i, x)
for x, y in zip(a, b): g(x, y)`,
      },
      {
        label: "Algorithms",
        cpp: `accumulate(a.begin(), a.end(), 0);
*max_element(a.begin(), a.end());
any_of(a.begin(), a.end(), pred);
all_of(a.begin(), a.end(), pred);
count(a.begin(), a.end(), x);`,
        py: `sum(a)
max(a)                    # max(a, key=len), max(a, default=0)
any(pred(x) for x in a)
all(pred(x) for x in a)
a.count(x)`,
      },
      {
        label: "Counting and grouping",
        cpp: `unordered_map<char, int> cnt;
for (char c : s) cnt[c]++;
unordered_map<int, vector<int>> g;
g[k].push_back(v);`,
        py: `from collections import Counter, defaultdict
cnt = Counter(s)
cnt.most_common(2)        # top 2 (value, count) pairs
g = defaultdict(list)
g[k].append(v)`,
      },
    ],
    differences: [
      "`range(a, b, step)` is half-open like a C++ loop, and lazy (no list is built).",
      "`zip` stops at the shortest input. `zip(*matrix)` transposes a matrix.",
      "`sorted(iterable, key=..., reverse=True)` returns a new list and works on any iterable, including dicts (sorts keys) and strings.",
      "`max` and `min` take `key=` and `default=`: `max(words, key=len)`.",
      "`Counter` supports arithmetic: `c1 - c2` (drops non-positive), `c1 & c2` (min), `c1 + c2`. And `Counter(a) == Counter(b)` checks anagrams.",
      "`functools.cache` (or `lru_cache(None)`) memoises a recursive function, replacing a hand-written memo table.",
      "`math.gcd`, `math.comb`, `math.isqrt`, `float('inf')` and `divmod` cover most number helpers.",
    ],
    examples: [
      {
        title: "Counter and defaultdict",
        code: `from collections import Counter, defaultdict

c = Counter("mississippi")
print(c["s"], c["z"])        # 4 0   (missing keys read as 0)
print(c.most_common(2))      # [('i', 4), ('s', 4)]
print(Counter("abc") == Counter("cab"))   # True: anagrams

d = defaultdict(int)
for w in "a b a c a".split():
    d[w] += 1                # no KeyError
print(dict(d))               # {'a': 3, 'b': 1, 'c': 1}`,
      },
      {
        title: "enumerate, zip, any, all, sorted",
        code: `names = ["ann", "bob", "cy"]
ages = [31, 25, 40]

for i, name in enumerate(names, start=1):
    print(i, name)

for name, age in zip(names, ages):
    print(name, age)

print(any(a > 35 for a in ages))     # True
print(all(a > 18 for a in ages))     # True
print(sorted(zip(ages, names)))      # [(25, 'bob'), (31, 'ann'), (40, 'cy')]
print(max(names, key=len))           # 'ann' (first of the longest)`,
      },
      {
        title: "Memoised recursion with functools.cache",
        code: `from functools import cache

@cache
def climb(n: int) -> int:
    if n <= 1:
        return 1
    return climb(n - 1) + climb(n - 2)

print(climb(40))   # 165580141, instantly`,
      },
    ],
    complexity: [
      { op: "enumerate / zip / range", code: "lazy iterators", time: "O(1) each step" },
      { op: "sum / min / max / any / all", code: "single pass", time: "O(n)", note: "any/all stop early" },
      { op: "sorted", code: "sorted(it, key=f)", time: "O(n log n)" },
      { op: "Counter(iterable)", code: "Counter(a)", time: "O(n)" },
      { op: "most_common(k)", code: "c.most_common(k)", time: "O(n log k)" },
      { op: "defaultdict access", code: "d[k]", time: "O(1) average" },
    ],
    choose: [
      "Counting → `Counter`. Grouping → `defaultdict(list)`.",
      "Need index and value → `enumerate`. Walking two lists together → `zip`.",
      "\"Is there any / are all\" → `any` / `all` with a generator.",
      "Top k by frequency → `Counter.most_common(k)` or a heap.",
      "Overlapping subproblems in a recursive function → `@cache`.",
    ],
    useCases: ["Frequency problems", "Anagrams", "Top k frequent", "Zipping parallel arrays", "Concise checks with any / all", "Memoised DP"],
    leetcode: [
      { title: "Number of Good Pairs", slug: "number-of-good-pairs" },
      { title: "Sort Characters By Frequency", slug: "sort-characters-by-frequency" },
      { title: "Top K Frequent Elements", slug: "top-k-frequent-elements" },
      { title: "Ransom Note", slug: "ransom-note" },
    ],
    mistakes: [
      "Writing `for i in range(len(a)):` then `a[i]` everywhere. Use `enumerate`.",
      "`any([...])` with a list comprehension builds the whole list first; pass a generator `any(...)` so it can stop early.",
      "Forgetting that `zip` silently truncates to the shorter input.",
      "Using `sorted(d)` and expecting `(key, value)` pairs; it returns sorted keys. Use `sorted(d.items())`.",
      "Using `@cache` on a function with list arguments (unhashable). Pass tuples or indices instead.",
    ],
  },
];

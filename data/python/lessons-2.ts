import type { PyLesson } from "./types";

export const lessons2: PyLesson[] = [
  /* ------------------------------------------------------------------ */
  {
    id: "tuples",
    title: "Tuples",
    cpp: "std::pair / std::tuple",
    py: "tuple",
    behavesLike: "pair / tuple (immutable, hashable)",
    summary: "Immutable, hashable sequences. Use them as pairs, as dict and set keys, and for multiple return values.",
    concept: [
      "A `tuple` is an immutable list. It plays the role of `std::pair` and `std::tuple`, but with any number of elements and no `.first` / `get<0>`: you just index or unpack.",
      "Because they're immutable, tuples are hashable when their elements are. That makes them the standard way to use a pair, a grid cell or a state as a dict key or set member.",
      "Tuples compare lexicographically, element by element, just like `std::pair`. That's what makes them work as heap entries and sort keys.",
    ],
    compare: [
      {
        label: "Pairs",
        cpp: `pair<int, int> p = {1, 2};
int a = p.first, b = p.second;
auto [x, y] = p;                  // C++17`,
        py: `p = (1, 2)                # parentheses optional: p = 1, 2
a, b = p                  # unpacking
x = p[0]`,
      },
      {
        label: "As keys",
        cpp: `set<pair<int,int>> visited;
visited.insert({r, c});
map<pair<int,int>, int> dist;`,
        py: `visited = set()
visited.add((r, c))
dist = {}
dist[(r, c)] = 0          # or dist[r, c] = 0`,
      },
      {
        label: "Multiple return values",
        cpp: `pair<int, int> minMax(vector<int>& a) {
  return {*min_element(...), *max_element(...)};
}
auto [lo, hi] = minMax(a);`,
        py: `def min_max(a):
    return min(a), max(a)      # returns a tuple

lo, hi = min_max(a)`,
      },
    ],
    differences: [
      "A one-element tuple needs a trailing comma: `(5,)`. `(5)` is just the int 5.",
      "You can't assign to an element: `p[0] = 3` raises `TypeError`. Build a new tuple.",
      "Unpacking works everywhere: `for r, c in cells:`, `a, b = b, a` (swap), `first, *rest = items`.",
      "Comparison is lexicographic: `(1, 5) < (2, 0)` is True. Sorting a list of tuples sorts by the first element, then the second, and so on.",
      "`tuple(lst)` converts a list so it can be hashed; `list(t)` goes back.",
    ],
    examples: [
      {
        title: "Grid neighbours with tuples",
        code: `DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))

def neighbours(r, c, rows, cols):
    for dr, dc in DIRS:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:   # chained comparison
            yield nr, nc

for nr, nc in neighbours(0, 0, 3, 3):
    print(nr, nc)      # (1, 0) then (0, 1)`,
      },
      {
        title: "Sorting and unpacking",
        code: `pairs = [(3, "c"), (1, "a"), (2, "b")]
pairs.sort()                     # by first element
for num, letter in pairs:
    print(num, letter)

a, b = 1, 2
a, b = b, a                      # swap, no temp
first, *rest = [1, 2, 3, 4]      # first = 1, rest = [2, 3, 4]`,
      },
    ],
    complexity: [
      { op: "Index", code: "t[i]", time: "O(1)" },
      { op: "Unpack", code: "a, b = t", time: "O(len(t))" },
      { op: "Hash (as key)", code: "d[(r, c)]", time: "O(len(t))", note: "Small constant for pairs" },
      { op: "Compare", code: "t1 < t2", time: "O(len(t)) worst" },
      { op: "Convert", code: "tuple(lst)", time: "O(n)" },
    ],
    choose: [
      "A fixed group of values (a pair, a coordinate, a state) → `tuple`.",
      "Need to use a sequence as a dict key or set member → `tuple`.",
      "Need to modify the elements → `list`.",
    ],
    useCases: ["Grid coordinates in visited sets", "Heap entries `(priority, item)`", "Multi-key sorting", "Returning several values", "Memoisation keys"],
    leetcode: [
      { title: "Valid Sudoku", slug: "valid-sudoku" },
      { title: "Equal Row and Column Pairs", slug: "equal-row-and-column-pairs" },
      { title: "Destination City", slug: "destination-city" },
      { title: "Number of Islands", slug: "number-of-islands" },
    ],
    mistakes: [
      "Writing `(x)` and expecting a tuple. Use `(x,)`.",
      "Using a list as a set element or dict key. Convert with `tuple(...)`.",
      "Trying to mutate a tuple element.",
      "Writing `p.first`: there are no named fields on a plain tuple (use `p[0]` or unpack, or `collections.namedtuple` if you really want names).",
    ],
    practice: [
      {
        level: "Beginner",
        title: "Destination City",
        leetcode: "destination-city",
        prompt: "`paths[i] = [a, b]` means a direct path from city a to city b. Return the city with no outgoing path.",
        sample: `Input:  paths = [["London","New York"], ["New York","Lima"], ["Lima","Sao Paulo"]]
Output: "Sao Paulo"`,
        starter: `def destCity(paths: list[list[str]]) -> str:
    pass`,
        hints: ["Unpack each path as `for a, b in paths`.", "The answer is a destination that never appears as a source."],
        solution: `def destCity(paths: list[list[str]]) -> str:
    sources = {a for a, _ in paths}
    for _, b in paths:
        if b not in sources:
            return b
    return ""`,
        complexity: "O(n) time and space.",
        review: [
          "Unpacks pairs in the loop header instead of indexing `p[0]`, `p[1]`.",
          "Uses `_` for values it doesn't need.",
          "Uses a set comprehension for the sources.",
        ],
      },
      {
        level: "Intermediate",
        title: "Equal Row and Column Pairs",
        leetcode: "equal-row-and-column-pairs",
        prompt: "Given an n × n grid, count pairs (row i, column j) where row i and column j contain the same values in the same order.",
        sample: `Input:  grid = [[3,2,1],[1,7,6],[2,7,7]]
Output: 1   (row 2 = column 1 = [2,7,7])`,
        starter: `def equalPairs(grid: list[list[int]]) -> int:
    pass`,
        hints: [
          "Count each row as a tuple in a dict.",
          "`zip(*grid)` yields the columns as tuples (it transposes the grid).",
        ],
        solution: `from collections import Counter

def equalPairs(grid: list[list[int]]) -> int:
    rows = Counter(tuple(row) for row in grid)
    return sum(rows[col] for col in zip(*grid))`,
        complexity: "O(n²) time and space.",
        review: [
          "Converts rows to tuples so they can be counted / hashed.",
          "Uses `zip(*grid)` for the transpose (columns come out as tuples already).",
          "Reads from the Counter with `rows[col]`, which returns 0 for missing keys without inserting.",
        ],
      },
      {
        level: "Interview",
        title: "Valid Sudoku",
        leetcode: "valid-sudoku",
        prompt: "Decide whether a partially filled 9 × 9 Sudoku board (cells are digits or `\".\"`) is valid: no repeated digit in any row, column or 3 × 3 box.",
        starter: `def isValidSudoku(board: list[list[str]]) -> bool:
    pass`,
        hints: [
          "Encode each constraint as a tuple: `(\"row\", r, d)`, `(\"col\", c, d)`, `(\"box\", r // 3, c // 3, d)`.",
          "One set of all seen tuples is enough. A repeat means invalid.",
        ],
        solution: `def isValidSudoku(board: list[list[str]]) -> bool:
    seen = set()
    for r in range(9):
        for c in range(9):
            d = board[r][c]
            if d == ".":
                continue
            keys = (("row", r, d), ("col", c, d), ("box", r // 3, c // 3, d))
            if any(k in seen for k in keys):
                return False
            seen.update(keys)
    return True`,
        complexity: "O(81) = O(1) for a fixed board; O(n²) for an n × n board.",
        review: [
          "Uses tuples as set elements to encode (kind, index, digit).",
          "Uses integer division `//` for the box index (not `/`, which gives a float).",
          "Uses `any(...)` with a generator for the check.",
          "Uses `seen.update(...)` to add several items at once.",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "stacks",
    title: "Stacks",
    cpp: "std::stack",
    py: "list",
    behavesLike: "stack (LIFO)",
    summary: "There's no stack class. A plain list with `append` and `pop` is the stack, and it's O(1) at the end.",
    concept: [
      "Python has no `stack` type. A list already does everything `std::stack` does: `append` is `push`, `pop()` is `top` + `pop` in one call, and `stack[-1]` is `top()`.",
      "Both ends of the operation are at the end of the array, so they're O(1) amortised, exactly like `vector::push_back`.",
      "Monotonic stacks, bracket matching, undo history and iterative DFS all use this pattern.",
    ],
    compare: [
      {
        label: "Stack operations",
        cpp: `stack<int> st;
st.push(1);
int t = st.top();
st.pop();                 // returns void
bool e = st.empty();`,
        py: `st = []
st.append(1)
t = st[-1]                # peek
t = st.pop()              # pop AND return
e = not st                # empty list is falsy`,
      },
      {
        label: "Pop while condition",
        cpp: `while (!st.empty() && st.top() < x) {
  st.pop();
}`,
        py: `while st and st[-1] < x:
    st.pop()`,
      },
    ],
    differences: [
      "`pop()` returns the element, so you don't need a separate `top()` + `pop()`.",
      "Check for empty with `if st:` / `if not st:` rather than `len(st) == 0`.",
      "`st[-1]` or `st.pop()` on an empty list raises `IndexError` (no undefined behaviour). Guard with `st and ...`.",
      "`collections.deque` also works as a stack, but a list is simpler and slightly faster for stack-only use.",
    ],
    examples: [
      {
        title: "Bracket matching",
        code: `def is_valid(s: str) -> bool:
    match = {")": "(", "]": "[", "}": "{"}
    st = []
    for c in s:
        if c in match:
            if not st or st.pop() != match[c]:
                return False
        else:
            st.append(c)
    return not st`,
      },
      {
        title: "Monotonic stack: next greater element",
        code: `nums = [2, 1, 2, 4, 3]
res = [-1] * len(nums)
st = []                         # indices, values decreasing
for i, x in enumerate(nums):
    while st and nums[st[-1]] < x:
        res[st.pop()] = x
    st.append(i)
print(res)                      # [4, 2, 4, -1, -1]`,
      },
      {
        title: "Iterative DFS",
        code: `graph = {0: [1, 2], 1: [3], 2: [3], 3: []}
st, seen = [0], {0}
while st:
    node = st.pop()
    print(node)
    for nxt in graph[node]:
        if nxt not in seen:
            seen.add(nxt)
            st.append(nxt)`,
      },
    ],
    complexity: [
      { op: "Push", code: "st.append(x)", time: "O(1) amortised" },
      { op: "Pop", code: "st.pop()", time: "O(1)" },
      { op: "Peek", code: "st[-1]", time: "O(1)" },
      { op: "Empty check", code: "not st", time: "O(1)" },
      { op: "Size", code: "len(st)", time: "O(1)" },
    ],
    choose: [
      "LIFO only → `list`.",
      "Need both ends → `deque`.",
      "Next greater / smaller, spans, histograms → monotonic stack on a list of indices.",
    ],
    useCases: ["Valid parentheses", "Monotonic stack (next greater, daily temperatures)", "Evaluate expressions", "Iterative DFS and tree traversal", "Undo / backtracking state"],
    leetcode: [
      { title: "Valid Parentheses", slug: "valid-parentheses" },
      { title: "Min Stack", slug: "min-stack" },
      { title: "Daily Temperatures", slug: "daily-temperatures" },
      { title: "Largest Rectangle in Histogram", slug: "largest-rectangle-in-histogram" },
    ],
    mistakes: [
      "Using `st.pop(0)`: that pops from the front (queue behaviour) and is O(n).",
      "Peeking with `st[-1]` without checking `st` first.",
      "Writing `st.top()` / `st.push()` / `st.empty()`: those methods don't exist on lists.",
      "Storing values when you need indices (for distances, widths or writing results back).",
    ],
    practice: [
      {
        level: "Beginner",
        title: "Valid Parentheses",
        leetcode: "valid-parentheses",
        prompt: "Given a string of `()[]{}`, return whether every bracket is closed by the same type in the correct order.",
        sample: `Input:  s = "([]{})"
Output: True`,
        starter: `def isValid(s: str) -> bool:
    pass`,
        hints: ["Push opening brackets.", "On a closing bracket, the stack must be non-empty and its top must match.", "At the end, the stack must be empty."],
        solution: `def isValid(s: str) -> bool:
    match = {")": "(", "]": "[", "}": "{"}
    st = []
    for c in s:
        if c in match:
            if not st or st.pop() != match[c]:
                return False
        else:
            st.append(c)
    return not st`,
        complexity: "O(n) time, O(n) space.",
        review: [
          "Uses a dict to map closers to openers instead of a chain of `if`s.",
          "Guards `st.pop()` with `not st` (short-circuit `or`).",
          "Returns `not st` rather than `len(st) == 0`.",
        ],
      },
      {
        level: "Intermediate",
        title: "Min Stack",
        leetcode: "min-stack",
        prompt: "Design a stack supporting `push`, `pop`, `top` and `getMin`, all in O(1).",
        starter: `class MinStack:
    def __init__(self):
        pass

    def push(self, val: int) -> None:
        pass

    def pop(self) -> None:
        pass

    def top(self) -> int:
        pass

    def getMin(self) -> int:
        pass`,
        hints: ["Store `(value, min_so_far)` tuples on one list.", "The minimum at any depth is the second element of the top tuple."],
        solution: `class MinStack:
    def __init__(self):
        self.st: list[tuple[int, int]] = []   # (value, min so far)

    def push(self, val: int) -> None:
        cur_min = min(val, self.st[-1][1]) if self.st else val
        self.st.append((val, cur_min))

    def pop(self) -> None:
        self.st.pop()

    def top(self) -> int:
        return self.st[-1][0]

    def getMin(self) -> int:
        return self.st[-1][1]`,
        complexity: "O(1) for every operation, O(n) space.",
        review: [
          "Instance state lives on `self` and is created in `__init__` (no class-level mutable lists shared between instances).",
          "Uses the conditional expression `a if cond else b`.",
          "Stores tuples rather than two parallel lists (either is fine; tuples keep them in sync).",
        ],
      },
      {
        level: "Interview",
        title: "Daily Temperatures",
        leetcode: "daily-temperatures",
        prompt: "For each day, return how many days you'd wait for a warmer temperature (0 if never).",
        sample: `Input:  temperatures = [73, 74, 75, 71, 69, 72, 76, 73]
Output: [1, 1, 4, 2, 1, 1, 0, 0]`,
        starter: `def dailyTemperatures(temperatures: list[int]) -> list[int]:
    pass`,
        hints: ["Keep a stack of indices whose answer isn't known yet.", "When today is warmer than the day on top, pop it and fill in `i - j`."],
        solution: `def dailyTemperatures(temperatures: list[int]) -> list[int]:
    res = [0] * len(temperatures)
    st = []                                  # indices, temps decreasing
    for i, t in enumerate(temperatures):
        while st and temperatures[st[-1]] < t:
            j = st.pop()
            res[j] = i - j
        st.append(i)
    return res`,
        complexity: "O(n) time (each index pushed and popped once), O(n) space.",
        review: [
          "Stores indices on the stack, not temperatures.",
          "Uses `while st and ...` to guard the peek.",
          "Can explain why it's O(n) amortised despite the nested loop.",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "queues",
    title: "Queues and deques",
    cpp: "std::queue / std::deque",
    py: "collections.deque",
    behavesLike: "deque (double-ended queue)",
    summary: "`collections.deque` gives O(1) push and pop at both ends. Use it for every queue; never `list.pop(0)`.",
    concept: [
      "`collections.deque` is a double-ended queue, the same idea as `std::deque`: O(1) `append`, `appendleft`, `pop`, `popleft`.",
      "Python has no separate `queue` class for algorithms (the `queue` module is for threads and is slow). A deque used with `append` + `popleft` is your FIFO queue.",
      "`deque(maxlen=k)` keeps only the last k items, and `rotate(n)` rotates in place, both handy in simulation problems.",
    ],
    compare: [
      {
        label: "FIFO queue",
        cpp: `queue<int> q;
q.push(1);
int f = q.front();
q.pop();
bool e = q.empty();`,
        py: `from collections import deque
q = deque()
q.append(1)
f = q[0]                   # peek front
f = q.popleft()            # pop AND return
e = not q`,
      },
      {
        label: "Double-ended",
        cpp: `deque<int> d;
d.push_front(1);
d.push_back(2);
d.pop_front();
d.pop_back();
int b = d.back();`,
        py: `d = deque()
d.appendleft(1)
d.append(2)
d.popleft()
d.pop()
b = d[-1]`,
      },
      {
        label: "BFS skeleton",
        cpp: `queue<int> q;
q.push(start);
seen.insert(start);
while (!q.empty()) {
  int u = q.front(); q.pop();
  for (int v : adj[u])
    if (!seen.count(v)) { seen.insert(v); q.push(v); }
}`,
        py: `q = deque([start])
seen = {start}
while q:
    u = q.popleft()
    for v in adj[u]:
        if v not in seen:
            seen.add(v)
            q.append(v)`,
      },
    ],
    differences: [
      "`list.pop(0)` and `list.insert(0, x)` are O(n). `deque.popleft()` and `appendleft()` are O(1).",
      "`deque([start])` takes an iterable. `deque(start)` with a string would split it into characters.",
      "Indexing the ends (`q[0]`, `q[-1]`) is O(1), but indexing the middle of a deque is O(n). Don't use it as an array.",
      "No slicing on deques. Convert with `list(q)` if you need it.",
      "For level-order BFS, process `for _ in range(len(q)):` to handle one level at a time.",
    ],
    examples: [
      {
        title: "Level-by-level BFS on a grid",
        code: `from collections import deque

grid = ["..#",
        "...",
        "#.."]
rows, cols = len(grid), len(grid[0])
q = deque([(0, 0)])
dist = {(0, 0): 0}
while q:
    r, c = q.popleft()
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "." and (nr, nc) not in dist:
            dist[nr, nc] = dist[r, c] + 1
            q.append((nr, nc))
print(dist[2, 2])   # 4`,
      },
      {
        title: "maxlen and rotate",
        code: `from collections import deque

recent = deque(maxlen=3)
for x in range(5):
    recent.append(x)
print(recent)          # deque([2, 3, 4], maxlen=3)

d = deque([1, 2, 3, 4])
d.rotate(1)            # deque([4, 1, 2, 3])
d.rotate(-2)           # deque([2, 3, 4, 1])`,
      },
    ],
    complexity: [
      { op: "Push / pop at either end", code: "append, appendleft, pop, popleft", time: "O(1)" },
      { op: "Peek either end", code: "q[0], q[-1]", time: "O(1)" },
      { op: "Index the middle", code: "q[i]", time: "O(n)" },
      { op: "Rotate", code: "q.rotate(k)", time: "O(k)" },
      { op: "Membership", code: "x in q", time: "O(n)" },
      { op: "list.pop(0) (avoid)", code: "lst.pop(0)", time: "O(n)" },
    ],
    choose: [
      "FIFO queue / BFS → `deque` with `append` + `popleft`.",
      "Sliding-window max/min → monotonic `deque` of indices.",
      "0-1 BFS → `deque` with `appendleft` for 0-weight edges.",
      "Only LIFO → a plain `list` is enough.",
    ],
    useCases: ["BFS (shortest path in unweighted graphs)", "Level-order tree traversal", "Sliding window maximum", "Simulations and round-robin", "Recent-items windows"],
    leetcode: [
      { title: "Number of Recent Calls", slug: "number-of-recent-calls" },
      { title: "Binary Tree Level Order Traversal", slug: "binary-tree-level-order-traversal" },
      { title: "Rotting Oranges", slug: "rotting-oranges" },
      { title: "Sliding Window Maximum", slug: "sliding-window-maximum" },
    ],
    mistakes: [
      "Using a list as a queue with `pop(0)`. It works on small tests and times out on big ones.",
      "Writing `deque(x)` for a single start item; it needs an iterable: `deque([x])`.",
      "Marking nodes visited when popping instead of when pushing, which enqueues duplicates.",
      "Importing `queue.Queue` for BFS: it's a thread-safe queue with locking overhead.",
    ],
    practice: [
      {
        level: "Beginner",
        title: "Number of Recent Calls",
        leetcode: "number-of-recent-calls",
        prompt: "Implement `RecentCounter` with `ping(t)`, which records a request at time `t` (strictly increasing) and returns how many requests happened in `[t - 3000, t]`.",
        starter: `class RecentCounter:
    def __init__(self):
        pass

    def ping(self, t: int) -> int:
        pass`,
        hints: ["Append each ping to a deque.", "Pop from the left while the oldest is too old."],
        solution: `from collections import deque

class RecentCounter:
    def __init__(self):
        self.q = deque()

    def ping(self, t: int) -> int:
        self.q.append(t)
        while self.q[0] < t - 3000:
            self.q.popleft()
        return len(self.q)`,
        complexity: "O(1) amortised per ping, O(w) space for the window.",
        review: [
          "Uses `deque` + `popleft`, not `list.pop(0)`.",
          "Peeks the front with `q[0]`.",
        ],
      },
      {
        level: "Intermediate",
        title: "Find the Winner of the Circular Game",
        leetcode: "find-the-winner-of-the-circular-game",
        prompt: "`n` friends sit in a circle numbered 1..n. Starting at friend 1, count `k` friends clockwise (including the start); the k-th leaves. Continue from the next friend. Return the winner.",
        sample: `Input:  n = 5, k = 2
Output: 3`,
        starter: `def findTheWinner(n: int, k: int) -> int:
    pass`,
        hints: ["Put 1..n in a deque.", "Rotate so the k-th friend is at the front, then `popleft`. `rotate(-(k - 1))` moves k - 1 friends to the back."],
        solution: `from collections import deque

def findTheWinner(n: int, k: int) -> int:
    q = deque(range(1, n + 1))
    while len(q) > 1:
        q.rotate(-(k - 1))
        q.popleft()
    return q[0]

# O(n) time, O(1) space: the Josephus recurrence
def findTheWinner2(n: int, k: int) -> int:
    winner = 0
    for size in range(2, n + 1):
        winner = (winner + k) % size
    return winner + 1`,
        complexity: "Deque simulation: O(n·k) time, O(n) space. Josephus: O(n) time, O(1) space.",
        review: [
          "Builds the deque from `range(1, n + 1)` directly.",
          "Uses `rotate` with a negative argument to rotate left.",
          "Can mention the Josephus formula as the optimal follow-up.",
        ],
      },
      {
        level: "Interview",
        title: "Sliding Window Maximum",
        leetcode: "sliding-window-maximum",
        prompt: "Return the maximum of every window of size `k` as it slides across `nums`, in O(n).",
        sample: `Input:  nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3
Output: [3, 3, 5, 5, 6, 7]`,
        starter: `def maxSlidingWindow(nums: list[int], k: int) -> list[int]:
    pass`,
        hints: [
          "Keep a deque of indices whose values are decreasing; the front is the window max.",
          "Before appending `i`, pop from the back while those values are ≤ `nums[i]`.",
          "Pop from the front when its index falls out of the window (`dq[0] <= i - k`).",
        ],
        solution: `from collections import deque

def maxSlidingWindow(nums: list[int], k: int) -> list[int]:
    dq = deque()          # indices, nums[dq] decreasing
    out = []
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            out.append(nums[dq[0]])
    return out`,
        complexity: "O(n) time (each index enters and leaves once), O(k) space.",
        review: [
          "Stores indices so it can tell when the front leaves the window.",
          "Pops from the back with `pop()` and from the front with `popleft()`.",
          "Starts emitting only once the first full window is formed (`i >= k - 1`).",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "heaps",
    title: "Heaps and priority queues",
    cpp: "std::priority_queue",
    py: "heapq",
    behavesLike: "priority_queue, but a MIN-heap",
    summary: "`heapq` turns a plain list into a min-heap. For a max-heap, push negated values.",
    concept: [
      "`heapq` is not a class: it's a set of functions that maintain the heap property on a normal list. `heap[0]` is always the smallest element.",
      "It's a min-heap. C++ `priority_queue<int>` is a max-heap by default, so this is the most common switching bug. For a max-heap, push `-x` and negate on the way out.",
      "Entries are compared with `<`, so tuples work as `(priority, tiebreak, item)`, the equivalent of a custom comparator.",
    ],
    compare: [
      {
        label: "Min-heap",
        cpp: `priority_queue<int, vector<int>, greater<int>> pq;
pq.push(5);
int top = pq.top();
pq.pop();`,
        py: `import heapq
pq = []
heapq.heappush(pq, 5)
top = pq[0]                  # peek smallest
top = heapq.heappop(pq)      # pop AND return`,
      },
      {
        label: "Max-heap",
        cpp: `priority_queue<int> pq;     // max-heap by default
pq.push(5);
int mx = pq.top();`,
        py: `pq = []
heapq.heappush(pq, -5)       # negate on push
mx = -pq[0]                  # negate on read
mx = -heapq.heappop(pq)`,
      },
      {
        label: "Custom priority",
        cpp: `using T = pair<int, int>;       // (dist, node)
priority_queue<T, vector<T>, greater<T>> pq;
pq.push({0, src});
auto [d, u] = pq.top(); pq.pop();`,
        py: `pq = [(0, src)]               # (dist, node)
d, u = heapq.heappop(pq)
heapq.heappush(pq, (d + w, v))`,
      },
    ],
    differences: [
      "Min-heap only. Max-heap = negate numbers. For strings or objects, use a tuple with a negated numeric key, or a wrapper class with `__lt__`.",
      "`heapq.heapify(lst)` turns an existing list into a heap in place in O(n), faster than n pushes.",
      "When priorities tie, the next tuple element is compared. If that's an object without `<` (like a `ListNode`), you get a `TypeError`. Add a unique counter: `(priority, i, node)`.",
      "`heapq.nlargest(k, it)` and `heapq.nsmallest(k, it)` solve many top-k problems in one line.",
      "There's no decrease-key. Push the new entry and skip stale ones when popped (lazy deletion).",
      "Only `heap[0]` is meaningful; the rest of the list isn't sorted.",
    ],
    examples: [
      {
        title: "Heapify, nlargest, max-heap",
        code: `import heapq

nums = [5, 1, 8, 3, 2]
heapq.heapify(nums)               # O(n), nums[0] == 1
print(heapq.heappop(nums))        # 1

print(heapq.nlargest(2, [5, 1, 8, 3]))   # [8, 5]
print(heapq.nsmallest(2, [5, 1, 8, 3]))  # [1, 3]

maxh = [-x for x in [5, 1, 8]]
heapq.heapify(maxh)
print(-maxh[0])                   # 8`,
      },
      {
        title: "Keep the k largest with a size-k min-heap",
        code: `import heapq

def k_largest(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)      # drop the smallest
    return h                      # h[0] is the k-th largest

print(k_largest([3, 2, 1, 5, 6, 4], 2))   # [5, 6]`,
      },
      {
        title: "Tie-breaking non-comparable items",
        code: `import heapq

tasks = [(2, "write"), (1, "plan"), (2, "test")]
h = []
for i, (prio, name) in enumerate(tasks):
    heapq.heappush(h, (prio, i, name))   # i breaks ties
while h:
    prio, _, name = heapq.heappop(h)
    print(prio, name)   # 1 plan, 2 write, 2 test`,
      },
    ],
    complexity: [
      { op: "Push", code: "heapq.heappush(h, x)", time: "O(log n)" },
      { op: "Pop smallest", code: "heapq.heappop(h)", time: "O(log n)" },
      { op: "Peek smallest", code: "h[0]", time: "O(1)" },
      { op: "Build from list", code: "heapq.heapify(h)", time: "O(n)" },
      { op: "Push then pop", code: "heapq.heappushpop(h, x)", time: "O(log n)" },
      { op: "Top k", code: "heapq.nlargest(k, it)", time: "O(n log k)" },
    ],
    choose: [
      "Repeatedly need the smallest / largest of a changing collection → heap.",
      "Top k of n items → size-k heap (O(n log k)) or `nlargest`.",
      "Dijkstra, Prim, merge k sorted lists, scheduling → heap of tuples.",
      "Need the whole thing sorted once → just `sorted()`.",
    ],
    useCases: ["Kth largest / top k", "Merge k sorted lists", "Dijkstra's shortest path", "Median of a stream (two heaps)", "Task scheduling"],
    leetcode: [
      { title: "Last Stone Weight", slug: "last-stone-weight" },
      { title: "Kth Largest Element in an Array", slug: "kth-largest-element-in-an-array" },
      { title: "Merge k Sorted Lists", slug: "merge-k-sorted-lists" },
      { title: "Find Median from Data Stream", slug: "find-median-from-data-stream" },
    ],
    mistakes: [
      "Assuming `heapq` is a max-heap like C++. It's a min-heap.",
      "Calling `pq.pop()` instead of `heapq.heappop(pq)`: that removes the last list element and breaks the heap.",
      "Pushing `(priority, node)` where nodes aren't comparable; ties then crash. Add a counter.",
      "Forgetting to negate back when reading from a max-heap.",
      "Sorting the list after every push. `heappush` already keeps it a heap.",
    ],
    practice: [
      {
        level: "Beginner",
        title: "Last Stone Weight",
        leetcode: "last-stone-weight",
        prompt: "Each turn, smash the two heaviest stones. Equal weights destroy both; otherwise the heavier becomes `y - x`. Return the last stone's weight, or 0.",
        sample: `Input:  stones = [2, 7, 4, 1, 8, 1]
Output: 1`,
        starter: `def lastStoneWeight(stones: list[int]) -> int:
    pass`,
        hints: ["You need a max-heap: negate the values.", "`heapify` the negated list once instead of pushing one by one."],
        solution: `import heapq

def lastStoneWeight(stones: list[int]) -> int:
    h = [-s for s in stones]
    heapq.heapify(h)
    while len(h) > 1:
        y = -heapq.heappop(h)      # heaviest
        x = -heapq.heappop(h)
        if y != x:
            heapq.heappush(h, -(y - x))
    return -h[0] if h else 0`,
        complexity: "O(n log n) time, O(n) space.",
        review: [
          "Negates for a max-heap and un-negates when reading.",
          "Uses `heapify` (O(n)) to build the heap.",
          "Uses `heapq.heappop(h)`, never `h.pop()`.",
        ],
      },
      {
        level: "Intermediate",
        title: "Kth Largest Element in an Array",
        leetcode: "kth-largest-element-in-an-array",
        prompt: "Return the k-th largest element in `nums` (in sorted order, not the k-th distinct).",
        sample: `Input:  nums = [3, 2, 1, 5, 6, 4], k = 2
Output: 5`,
        starter: `def findKthLargest(nums: list[int], k: int) -> int:
    pass`,
        hints: ["Keep a min-heap of size k: its smallest element is the k-th largest.", "`heappushpop` pushes and pops in one O(log k) step."],
        solution: `import heapq

def findKthLargest(nums: list[int], k: int) -> int:
    h = nums[:k]
    heapq.heapify(h)
    for x in nums[k:]:
        if x > h[0]:
            heapq.heapreplace(h, x)   # pop smallest, then push x
    return h[0]

# One-liner: return heapq.nlargest(k, nums)[-1]`,
        complexity: "O(n log k) time, O(k) space.",
        review: [
          "Uses a size-k MIN-heap (not a max-heap of all n).",
          "Knows `heapreplace` / `heappushpop` and `nlargest`.",
          "Can mention quickselect for average O(n).",
        ],
      },
      {
        level: "Interview",
        title: "Find Median from Data Stream",
        leetcode: "find-median-from-data-stream",
        prompt: "Implement `MedianFinder` with `addNum(num)` and `findMedian()`. Aim for O(log n) add and O(1) median.",
        starter: `class MedianFinder:
    def __init__(self):
        pass

    def addNum(self, num: int) -> None:
        pass

    def findMedian(self) -> float:
        pass`,
        hints: [
          "Keep the smaller half in a max-heap (negated) and the larger half in a min-heap.",
          "Always push through one heap into the other so the halves stay ordered, then rebalance sizes.",
          "Let the lower half hold the extra element when the count is odd.",
        ],
        solution: `import heapq

class MedianFinder:
    def __init__(self):
        self.lo: list[int] = []   # max-heap (negated): smaller half
        self.hi: list[int] = []   # min-heap: larger half

    def addNum(self, num: int) -> None:
        heapq.heappush(self.lo, -num)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))  # move lo's max to hi
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def findMedian(self) -> float:
        if len(self.lo) > len(self.hi):
            return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2`,
        complexity: "addNum O(log n), findMedian O(1), O(n) space.",
        review: [
          "Uses two heaps with a clear invariant (`len(lo) == len(hi)` or `len(lo) == len(hi) + 1`).",
          "Negation is applied consistently on every push and read of `lo`.",
          "Uses `/ 2` for the float median (true division), not `// 2`.",
        ],
      },
    ],
  },
];

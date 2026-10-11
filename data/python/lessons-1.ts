import type { PyLesson } from "./types";

export const lessons1: PyLesson[] = [
  /* ------------------------------------------------------------------ */
  {
    id: "lists",
    title: "Lists",
    cpp: "std::vector",
    py: "list",
    behavesLike: "vector (dynamic array)",
    summary: "Your default container. A dynamic array of references with slicing, negative indexing and comprehensions built in.",
    concept: [
      "A Python `list` is a dynamic array, exactly like `std::vector`: contiguous storage, O(1) random access, amortised O(1) append at the end, O(n) insert or erase anywhere else.",
      "The difference is what it stores. A `vector<int>` stores ints inline; a Python list stores references to objects, so one list can mix types and every element is a pointer. You rarely notice this except when copying (see mistakes).",
      "Lists are the answer for arrays, stacks, DP tables, adjacency lists and result buffers. Learn slicing and comprehensions well and half of your C++ loops disappear.",
    ],
    compare: [
      {
        label: "Create, access, size",
        cpp: `vector<int> a = {3, 1, 4};
vector<int> z(5, 0);        // five zeros
int x = a[0];
int last = a.back();
int n = a.size();`,
        py: `a = [3, 1, 4]
z = [0] * 5                # five zeros
x = a[0]
last = a[-1]               # negative index from the end
n = len(a)`,
      },
      {
        label: "Add and remove",
        cpp: `a.push_back(5);
a.pop_back();
a.insert(a.begin() + 1, 9);
a.erase(a.begin() + 1);
a.clear();`,
        py: `a.append(5)
a.pop()                    # also returns the value
a.insert(1, 9)
del a[1]                   # or a.pop(1) to get it back
a.clear()`,
      },
      {
        label: "Sort and reverse",
        cpp: `sort(a.begin(), a.end());
sort(a.rbegin(), a.rend());
sort(v.begin(), v.end(), [](auto& p, auto& q) {
  return p[1] < q[1];
});
reverse(a.begin(), a.end());`,
        py: `a.sort()                   # in place, returns None
a.sort(reverse=True)
v.sort(key=lambda p: p[1]) # key function, not comparator
a.reverse()                # in place
b = sorted(a)              # new list, a unchanged
r = a[::-1]                # reversed copy`,
      },
      {
        label: "2D grid",
        cpp: `vector<vector<int>> g(m, vector<int>(n, 0));
g[i][j] = 1;`,
        py: `g = [[0] * n for _ in range(m)]
g[i][j] = 1`,
      },
    ],
    differences: [
      "Slicing `a[l:r]` returns a new list of `a[l..r-1]` and costs O(r - l). `a[l:r:step]` adds a step; `a[::-1]` is a reversed copy.",
      "Negative indices count from the end: `a[-1]` is `a.back()`, `a[-2]` the one before it.",
      "`a.sort()` sorts in place and returns `None`; `sorted(a)` returns a new list. Both are stable (Timsort), O(n log n).",
      "Python sorts with a `key=` function instead of a comparator. To sort by several fields, return a tuple: `key=lambda p: (p[0], -p[1])`.",
      "Out-of-range indexing raises `IndexError` instead of undefined behaviour. Out-of-range slicing never raises: `a[5:100]` is just shorter.",
      "List comprehensions replace most build-a-vector loops: `[x * x for x in a if x > 0]`.",
    ],
    examples: [
      {
        title: "Comprehensions and slicing",
        code: `nums = [5, 2, 8, 1, 9]

squares = [x * x for x in nums]          # [25, 4, 64, 1, 81]
evens = [x for x in nums if x % 2 == 0]  # [2, 8]
first_three = nums[:3]                   # [5, 2, 8]
last_two = nums[-2:]                     # [1, 9]
every_other = nums[::2]                  # [5, 8, 9]
copy = nums[:]                           # shallow copy (or nums.copy())

# Iterate with the index, like for (int i = 0; ...)
for i, x in enumerate(nums):
    print(i, x)`,
      },
      {
        title: "Prefix sums, the Pythonic way",
        code: `nums = [3, 1, 4, 1, 5]
prefix = [0] * (len(nums) + 1)
for i, x in enumerate(nums):
    prefix[i + 1] = prefix[i] + x
# prefix = [0, 3, 4, 8, 9, 14]; sum(nums[l:r]) == prefix[r] - prefix[l]

# Or with the standard library:
from itertools import accumulate
prefix = [0, *accumulate(nums)]`,
      },
      {
        title: "Sorting pairs by custom keys",
        code: `intervals = [[5, 7], [1, 3], [2, 6]]
intervals.sort(key=lambda iv: iv[0])     # by start
# [[1, 3], [2, 6], [5, 7]]

people = [("ann", 30), ("bob", 25), ("cat", 30)]
people.sort(key=lambda p: (-p[1], p[0])) # age desc, then name asc
# [('ann', 30), ('cat', 30), ('bob', 25)]`,
      },
    ],
    complexity: [
      { op: "Index read / write", code: "a[i], a[i] = x", time: "O(1)" },
      { op: "Append / pop from end", code: "a.append(x), a.pop()", time: "O(1) amortised" },
      { op: "Insert / pop at front or middle", code: "a.insert(0, x), a.pop(0)", time: "O(n)", note: "Use deque for a queue" },
      { op: "Search", code: "x in a, a.index(x)", time: "O(n)", note: "Linear scan, not a set" },
      { op: "Slice", code: "a[l:r]", time: "O(r − l)", note: "Allocates a copy" },
      { op: "Sort", code: "a.sort(), sorted(a)", time: "O(n log n)" },
      { op: "Length", code: "len(a)", time: "O(1)" },
      { op: "Min / max / sum", code: "min(a), max(a), sum(a)", time: "O(n)" },
    ],
    choose: [
      "Need random access by index, or an ordered sequence you append to → `list`.",
      "Need to push or pop at the front too → `collections.deque`, not a list.",
      "Need fast membership tests (`x in ...`) → `set` or `dict`, not a list.",
    ],
    useCases: ["Arrays and two pointers", "Prefix sums", "DP tables (1D and 2D)", "Stacks", "Building results", "Sorting with custom keys"],
    leetcode: [
      { title: "Two Sum II", slug: "two-sum-ii-input-array-is-sorted" },
      { title: "Merge Intervals", slug: "merge-intervals" },
      { title: "Rotate Array", slug: "rotate-array" },
      { title: "Product of Array Except Self", slug: "product-of-array-except-self" },
    ],
    mistakes: [
      "`grid = [[0] * n] * m` creates m references to the same row; writing `grid[0][0] = 1` changes every row. Use `[[0] * n for _ in range(m)]`.",
      "`b = a` does not copy; both names point to the same list. Use `a[:]`, `a.copy()` or `list(a)` (shallow), or `copy.deepcopy` for nested lists.",
      "`a = a.sort()` sets `a` to `None`. `sort()` works in place and returns nothing.",
      "`a.pop(0)` in a loop is O(n) each time, so BFS with a list is O(n²). Use `deque.popleft()`.",
      "Writing a C-style `for i in range(len(a)):` when you only need the values. Use `for x in a:` or `for i, x in enumerate(a):`.",
      "Modifying a list while iterating over it skips elements. Build a new list with a comprehension instead.",
      "In LeetCode, \"modify in place\" means mutate the list object: `nums[:] = result`, not `nums = result` (that only rebinds a local name).",
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "strings",
    title: "Strings",
    cpp: "std::string",
    py: "str",
    behavesLike: "const std::string (immutable)",
    summary: "Immutable sequences of characters. Build with a list and `''.join`, never with `+=` in a loop.",
    concept: [
      "A Python `str` is like a `const std::string`: you can read characters and slice, but you can't change one in place. Every \"modification\" creates a new string.",
      "There is no `char` type. `s[0]` is a string of length 1. Use `ord(c)` and `chr(n)` to convert to and from code points, the way you'd use `c - 'a'` in C++.",
      "Because strings are immutable, they are hashable, so they can be dict keys and set members directly.",
    ],
    compare: [
      {
        label: "Basics",
        cpp: `string s = "hello";
char c = s[0];
int n = s.size();
string t = s.substr(1, 3);   // pos, length
s[0] = 'H';                   // OK in C++`,
        py: `s = "hello"
c = s[0]                      # 'h', a str of length 1
n = len(s)
t = s[1:4]                    # start, END (exclusive)
s = "H" + s[1:]               # must build a new string`,
      },
      {
        label: "Char arithmetic",
        cpp: `int idx = c - 'a';
char d = 'a' + 2;
bool dig = isdigit(c);
bool alpha = isalnum(c);
char up = toupper(c);`,
        py: `idx = ord(c) - ord('a')
d = chr(ord('a') + 2)         # 'c'
dig = c.isdigit()
alpha = c.isalnum()
up = c.upper()`,
      },
      {
        label: "Building a string",
        cpp: `string out;
for (char c : s) out += c;   // amortised O(1)
reverse(out.begin(), out.end());`,
        py: `parts = []
for c in s:
    parts.append(c)
out = "".join(parts)          # O(total length)
out = out[::-1]               # reversed copy`,
      },
      {
        label: "Split, join, find",
        cpp: `// split needs stringstream
stringstream ss(line);
string w;
while (ss >> w) words.push_back(w);
size_t p = s.find("lo");     // npos if missing`,
        py: `words = line.split()          # on any whitespace
parts = "a,b,c".split(",")    # ['a', 'b', 'c']
joined = " ".join(words)
p = s.find("lo")              # -1 if missing`,
      },
    ],
    differences: [
      "Strings are immutable: `s[0] = 'x'` raises `TypeError`. Convert to a list (`chars = list(s)`), edit, then `''.join(chars)`.",
      "`s += c` in a loop can be O(n²) in the worst case because each step may copy. Collect pieces in a list and `''.join` once.",
      "Slices use end indices, not lengths: C++ `s.substr(i, len)` is Python `s[i:i + len]`.",
      "Comparison with `==` compares contents (like C++ `std::string`), and `<` is lexicographic.",
      "`str.split()` with no argument splits on runs of whitespace and drops empty strings; `split(' ')` keeps empties.",
      "Handy methods: `strip`, `lower`, `upper`, `startswith`, `endswith`, `isalpha`, `isdigit`, `isalnum`, `count`, `replace`.",
    ],
    examples: [
      {
        title: "Character counting with a fixed array",
        code: `s = "leetcode"
count = [0] * 26
for c in s:
    count[ord(c) - ord('a')] += 1

# The Pythonic shortcut (covered in the tools lesson):
from collections import Counter
freq = Counter(s)          # Counter({'e': 3, 'l': 1, 't': 1, ...})`,
      },
      {
        title: "Editing a string via a list",
        code: `s = "hello"
chars = list(s)            # ['h', 'e', 'l', 'l', 'o']
chars[0] = "H"
s = "".join(chars)         # 'Hello'

# Two-pointer reverse in place on the list
l, r = 0, len(chars) - 1
while l < r:
    chars[l], chars[r] = chars[r], chars[l]
    l += 1
    r -= 1`,
      },
      {
        title: "Common one-liners",
        code: `s = "  A man, a plan  "
clean = "".join(c.lower() for c in s if c.isalnum())  # 'amanaplan'
is_pal = clean == clean[::-1]
words = s.split()                                      # ['A', 'man,', 'a', 'plan']
reversed_words = " ".join(reversed(words))
sorted_key = "".join(sorted("eat"))                    # 'aet' (anagram key)`,
      },
    ],
    complexity: [
      { op: "Index", code: "s[i]", time: "O(1)" },
      { op: "Slice", code: "s[l:r]", time: "O(r − l)", note: "Copies" },
      { op: "Concatenate", code: "s + t", time: "O(len(s) + len(t))" },
      { op: "Join", code: "''.join(parts)", time: "O(total length)" },
      { op: "Substring search", code: "t in s, s.find(t)", time: "O(n·m) worst case" },
      { op: "Compare", code: "s == t", time: "O(n)" },
      { op: "Reverse", code: "s[::-1]", time: "O(n)" },
    ],
    choose: [
      "Read-only scanning, slicing, hashing → keep it a `str`.",
      "Many in-place edits (swaps, replacements) → `list(s)`, edit, then `''.join`.",
      "Counting characters → `[0] * 26` for lowercase letters, or `Counter(s)` in general.",
    ],
    useCases: ["Palindromes and two pointers", "Anagrams (sorted key or counts)", "Sliding window over characters", "Parsing and tokenising", "String building"],
    leetcode: [
      { title: "Valid Palindrome", slug: "valid-palindrome" },
      { title: "Valid Anagram", slug: "valid-anagram" },
      { title: "Reverse Words in a String", slug: "reverse-words-in-a-string" },
      { title: "Longest Palindromic Substring", slug: "longest-palindromic-substring" },
    ],
    mistakes: [
      "Trying `s[i] = c`. Strings are immutable; use a list of characters.",
      "Using `s += c` inside a loop on long strings. Use `parts.append(c)` then `''.join(parts)`.",
      "Writing `c - 'a'`: there's no char arithmetic. Use `ord(c) - ord('a')`.",
      "Thinking `s[i:j]` takes a length like `substr`. The second number is an end index.",
      "Expecting `find` to return `npos`; it returns `-1`. `s.index(t)` raises `ValueError` instead.",
      "Forgetting that `'a' < 'B'` is False: uppercase letters sort before lowercase (ASCII), same as C++.",
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "dicts",
    title: "Dictionaries",
    cpp: "std::unordered_map",
    py: "dict",
    behavesLike: "unordered_map (hash map)",
    summary: "The hash map. Average O(1) insert, lookup and delete, and it remembers insertion order.",
    concept: [
      "A `dict` is a hash map, the direct replacement for `unordered_map`. Average O(1) for insert, lookup and delete.",
      "Unlike `unordered_map`, a dict iterates in insertion order (guaranteed since Python 3.7). It is not sorted, so it is not a `std::map`. For sorted keys, sort them when you need them: `for k in sorted(d):`.",
      "Keys must be hashable: ints, strings, tuples of hashables. Lists and sets can't be keys; convert to a tuple first.",
    ],
    compare: [
      {
        label: "Insert and look up",
        cpp: `unordered_map<string, int> m;
m["a"] = 1;
int x = m["b"];          // inserts 0 if missing!
if (m.count("a")) { ... }
m.erase("a");`,
        py: `m = {}
m["a"] = 1
x = m["b"]               # KeyError if missing
x = m.get("b", 0)        # default, no insert
if "a" in m: ...
del m["a"]               # or m.pop("a", None)`,
      },
      {
        label: "Frequency count",
        cpp: `unordered_map<int, int> freq;
for (int x : nums) freq[x]++;`,
        py: `freq = {}
for x in nums:
    freq[x] = freq.get(x, 0) + 1

# or, idiomatically:
from collections import Counter
freq = Counter(nums)`,
      },
      {
        label: "Iterate",
        cpp: `for (auto& [k, v] : m)
  cout << k << " " << v;`,
        py: `for k, v in m.items():
    print(k, v)
for k in m: ...            # keys
for v in m.values(): ...`,
      },
      {
        label: "Map of vectors",
        cpp: `unordered_map<string, vector<string>> groups;
groups[key].push_back(word);`,
        py: `from collections import defaultdict
groups = defaultdict(list)
groups[key].append(word)`,
      },
    ],
    differences: [
      "`m[k]` on a missing key raises `KeyError`; it does not insert a default like C++ `operator[]`. Use `m.get(k, default)`, `k in m`, or `defaultdict`.",
      "`k in m` is the equivalent of `m.count(k)` / `m.contains(k)` and is O(1).",
      "Dicts keep insertion order but are not sorted. There is no built-in `std::map`; use `sorted(m)` or the `sortedcontainers` package (available on LeetCode).",
      "You can't change a dict's size while iterating over it. Iterate over `list(m)` if you need to delete.",
      "Dict comprehension: `{x: i for i, x in enumerate(nums)}`.",
      "`m.setdefault(k, []).append(v)` works without `defaultdict`, but `defaultdict(list)` reads better.",
    ],
    examples: [
      {
        title: "Value → index map (the Two Sum pattern)",
        code: `nums = [2, 7, 11, 15]
target = 9
seen = {}                      # value -> index
for i, x in enumerate(nums):
    if target - x in seen:
        print(seen[target - x], i)   # 0 1
    seen[x] = i`,
      },
      {
        title: "Grouping with defaultdict",
        code: `from collections import defaultdict

words = ["eat", "tea", "tan", "ate", "nat", "bat"]
groups = defaultdict(list)
for w in words:
    groups["".join(sorted(w))].append(w)
print(list(groups.values()))
# [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]`,
      },
      {
        title: "Prefix-sum counts",
        code: `count = {0: 1}          # prefix sum -> how many times seen
running = 0
for x in [1, 1, 1]:
    running += x
    count[running] = count.get(running, 0) + 1
# {0: 1, 1: 1, 2: 1, 3: 1}`,
      },
    ],
    complexity: [
      { op: "Get / set / delete", code: "d[k], d[k] = v, del d[k]", time: "O(1) average", note: "O(n) worst case" },
      { op: "Membership", code: "k in d", time: "O(1) average" },
      { op: "Get with default", code: "d.get(k, 0)", time: "O(1) average" },
      { op: "Iterate", code: "d.items(), d.keys()", time: "O(n)" },
      { op: "Sorted keys", code: "sorted(d)", time: "O(n log n)" },
      { op: "Length", code: "len(d)", time: "O(1)" },
    ],
    choose: [
      "Map from key to value with fast lookups → `dict`.",
      "Counting things → `Counter` (a dict subclass).",
      "Key → list / set of things → `defaultdict(list)` / `defaultdict(set)`.",
      "Need keys in sorted order while inserting (like `std::map`) → sort on demand, a heap, or `sortedcontainers.SortedDict`.",
    ],
    useCases: ["Two Sum and complements", "Frequency counting", "Grouping (anagrams)", "Prefix sum + hash map", "Memoisation", "Graph adjacency lists"],
    leetcode: [
      { title: "Two Sum", slug: "two-sum" },
      { title: "Group Anagrams", slug: "group-anagrams" },
      { title: "Subarray Sum Equals K", slug: "subarray-sum-equals-k" },
      { title: "LRU Cache", slug: "lru-cache" },
    ],
    mistakes: [
      "Expecting `d[k] += 1` to work on a missing key like C++. It raises `KeyError`; use `d[k] = d.get(k, 0) + 1`, `Counter`, or `defaultdict(int)`.",
      "Using a list as a key: `d[[1, 2]]` raises `TypeError`. Use `d[(1, 2)]`.",
      "Assuming dict iteration is sorted. It's insertion order.",
      "Deleting keys while looping over `d`. Loop over `list(d)` instead.",
      "Reading a missing key from a `defaultdict` inserts it. Use `k in d` to check without inserting.",
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: "sets",
    title: "Sets",
    cpp: "std::unordered_set",
    py: "set",
    behavesLike: "unordered_set (hash set)",
    summary: "Hash set with O(1) membership and built-in union, intersection and difference operators.",
    concept: [
      "A `set` is a hash set, like `unordered_set`: unique elements, average O(1) add, remove and membership, no order.",
      "Python adds math-style operators that C++ only has through `<algorithm>` on sorted ranges: `a | b` (union), `a & b` (intersection), `a - b` (difference), `a ^ b` (symmetric difference).",
      "`frozenset` is the immutable, hashable version, useful when a set itself must be a key or an element of another set.",
    ],
    compare: [
      {
        label: "Basics",
        cpp: `unordered_set<int> s;
s.insert(3);
if (s.count(3)) { ... }
s.erase(3);
int n = s.size();`,
        py: `s = set()               # NOT {} (that's an empty dict)
s.add(3)
if 3 in s: ...
s.discard(3)            # no error if missing
n = len(s)`,
      },
      {
        label: "Build from a container",
        cpp: `unordered_set<int> s(nums.begin(), nums.end());
bool hasDup = s.size() < nums.size();`,
        py: `s = set(nums)
has_dup = len(s) < len(nums)`,
      },
      {
        label: "Set algebra",
        cpp: `// needs sorted ranges + set_intersection
vector<int> out;
set_intersection(a.begin(), a.end(),
                 b.begin(), b.end(),
                 back_inserter(out));`,
        py: `both = a & b            # intersection
either = a | b          # union
only_a = a - b          # difference
one_side = a ^ b        # symmetric difference
a <= b                  # is subset`,
      },
    ],
    differences: [
      "`{}` is an empty dict. An empty set is `set()`. `{1, 2}` with values is a set.",
      "`s.remove(x)` raises `KeyError` if missing; `s.discard(x)` doesn't.",
      "Sets are unordered; don't rely on iteration order. Use `sorted(s)` when order matters.",
      "Elements must be hashable: tuples yes, lists no.",
      "Set comprehension: `{x % 10 for x in nums}`.",
    ],
    examples: [
      {
        title: "Visited set and dedup",
        code: `nums = [3, 1, 3, 2, 1]
unique = set(nums)                    # {1, 2, 3}
unique_sorted = sorted(set(nums))     # [1, 2, 3]

# Keep first occurrence, preserve order:
seen = set()
ordered = []
for x in nums:
    if x not in seen:
        seen.add(x)
        ordered.append(x)             # [3, 1, 2]
# shortcut: list(dict.fromkeys(nums))`,
      },
      {
        title: "Set operations",
        code: `a = {1, 2, 3, 4}
b = {3, 4, 5}
print(a & b)   # {3, 4}
print(a | b)   # {1, 2, 3, 4, 5}
print(a - b)   # {1, 2}
print(a ^ b)   # {1, 2, 5}

visited = set()
visited.add((0, 0))        # grid cells as tuples
print((0, 0) in visited)   # True`,
      },
    ],
    complexity: [
      { op: "Add / discard", code: "s.add(x), s.discard(x)", time: "O(1) average" },
      { op: "Membership", code: "x in s", time: "O(1) average" },
      { op: "Build from list", code: "set(a)", time: "O(n)" },
      { op: "Union", code: "a | b", time: "O(len(a) + len(b))" },
      { op: "Intersection", code: "a & b", time: "O(min(len(a), len(b)))" },
      { op: "Difference", code: "a - b", time: "O(len(a))" },
    ],
    choose: [
      "Only need \"have I seen this?\" → `set`.",
      "Need a count or associated value → `dict` / `Counter`.",
      "Need sorted unique values with order queries (`lower_bound` on a `std::set`) → sorted list + `bisect`, or `sortedcontainers.SortedList`.",
    ],
    useCases: ["Visited sets in BFS/DFS", "Duplicate detection", "Sliding window uniqueness", "Longest consecutive sequence", "Intersections of lists"],
    leetcode: [
      { title: "Contains Duplicate", slug: "contains-duplicate" },
      { title: "Happy Number", slug: "happy-number" },
      { title: "Longest Consecutive Sequence", slug: "longest-consecutive-sequence" },
      { title: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters" },
    ],
    mistakes: [
      "Writing `s = {}` for an empty set. That's a dict; `s.add` then fails.",
      "Checking `x in some_list` inside a loop (O(n) each). Convert to a set once.",
      "Adding lists: `s.add([r, c])` fails. Use `s.add((r, c))`.",
      "Expecting `std::set` behaviour: Python's `set` is unordered, with no `lower_bound`.",
      "Using `remove` on a value that may not be there; use `discard`.",
    ],
  },
];

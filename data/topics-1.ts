import { P, type Topic } from "./types";

export const arraysHashing: Topic = {
  id: "arrays-hashing",
  name: "Arrays & Hashing",
  blurb:
    "Trade memory for time: remember what you've seen so each element costs O(1) instead of a rescan.",
  patterns: [
    {
      id: "complement-lookup",
      transfer: ["3Sum-style pair finding after sorting", "Count pairs with a given difference/sum", "Two Sum on BST, in a stream, or in a linked list"],
      name: "Hash Map: Seen / Complement Lookup",
      signals: [
        "Find a pair/element that satisfies a condition with another element",
        "Detect duplicates or 'have I seen this before?'",
        "Brute force is O(n²) nested loops over pairs",
      ],
      approach:
        "Walk the array once. For each x, compute what partner you need (target - x), check the map, then store x. Checking before inserting avoids pairing an element with itself.",
      template: `seen = {}
for i, x in enumerate(nums):
    need = target - x
    if need in seen: return [seen[need], i]
    seen[x] = i`,
      variations: [
        "Store index vs. count vs. last position, depending on what the answer needs",
        "Set instead of map when you only need membership",
        "Pair → triple turns into sort + two pointers instead (see Two Pointers)",
      ],
      pitfalls: [
        "Inserting before checking breaks cases like target = 2x",
        "Duplicates: decide whether to store first or last index",
      ],
      problems: [
        P("contains-duplicate", "Contains Duplicate", "Easy", "A set answers 'seen before?' in O(1)."),
        P("two-sum", "Two Sum", "Easy", "Store value → index; look up the complement as you go."),
        P("valid-anagram", "Valid Anagram", "Easy", "Compare frequency counts; counts are a signature."),
      ],
    },
    {
      id: "grouping-by-key",
      transfer: ["Group Shifted Strings (key = normalized difference sequence)", "Find duplicate files / subtrees by serialized key", "Top-K on any frequency/score stream"],
      name: "Hash Map: Group by Canonical Key",
      signals: [
        "Group items that are 'equivalent' under some transformation",
        "Top-K most frequent",
        "Need a signature that is identical for equivalent items",
      ],
      approach:
        "Design a canonical key (sorted string, count tuple, bucket index) so equivalent items collide, then bucket them in a map. For top-K, count then bucket-sort by frequency to get O(n).",
      template: `groups = defaultdict(list)
for s in items:
    groups[canonical(s)].append(s)
return list(groups.values())`,
      variations: [
        "Key = sorted string (O(k log k)) or 26-count tuple (O(k))",
        "Frequency → bucket array indexed by count avoids a heap",
        "Heap of size k when buckets are impractical",
      ],
      pitfalls: ["Lists aren't hashable — convert to a tuple/string key"],
      problems: [
        P("group-anagrams", "Group Anagrams", "Medium", "Choosing the canonical key is the whole problem."),
        P("top-k-frequent-elements", "Top K Frequent Elements", "Medium", "Count, then bucket by frequency for O(n)."),
      ],
    },
    {
      id: "prefix-sum-hashmap",
      name: "Prefix Sum (+ Hash Map)",
      signals: [
        "Subarray sum equals / divisible by K",
        "Many range-sum queries",
        "Array may contain negatives (so sliding window fails)",
      ],
      approach:
        "prefix[j] - prefix[i] = sum of (i, j]. To count subarrays summing to k, at each j look up how many earlier prefixes equal prefix[j] - k. Seed the map with {0: 1} for subarrays starting at index 0.",
      template: `count = {0: 1}; run = 0; ans = 0
for x in nums:
    run += x
    ans += count.get(run - k, 0)
    count[run] = count.get(run, 0) + 1`,
      variations: [
        "Prefix mod k for 'divisible by k'",
        "Longest subarray: store the *first* index of each prefix value (Contiguous Array maps 0→-1, 1→+1)",
        "Prefix/suffix product arrays (no division) — same idea, different operator",
        "2D prefix sums for matrix region queries",
      ],
      pitfalls: [
        "Forgetting the {0:1} seed",
        "Sliding window is wrong here when negatives exist",
      ],
      problems: [
        P("product-of-array-except-self", "Product of Array Except Self", "Medium", "Left-product pass then right-product pass."),
        P("subarray-sum-equals-k", "Subarray Sum Equals K", "Medium", "Count earlier prefixes equal to run - k."),
        P("contiguous-array", "Contiguous Array", "Medium", "Map 0→-1, then it's longest subarray with sum 0."),
      ],
    },
    {
      id: "set-sequence",
      transfer: ["Longest consecutive path in a tree/graph via 'start at heads'", "Union-find alternative for sequences", "Any chain-length question where chains have unique starts"],
      name: "Set for O(1) Membership / Sequence Start",
      signals: [
        "Longest consecutive sequence, but sorting (O(n log n)) is disallowed",
        "Need to know whether value±1 exists",
      ],
      approach:
        "Put everything in a set. Only start counting from numbers with no predecessor (x-1 not in set); that makes every element visited at most twice overall → O(n).",
      template: `S = set(nums); best = 0
for x in S:
    if x - 1 not in S:
        y = x
        while y + 1 in S: y += 1
        best = max(best, y - x + 1)`,
      variations: ["Same 'only start at the head' trick for chains in a graph/array"],
      pitfalls: ["Iterate the set, not the list, or duplicates blow the complexity"],
      problems: [
        P("longest-consecutive-sequence", "Longest Consecutive Sequence", "Medium", "Only expand from sequence starts."),
      ],
    },
    {
      id: "index-as-hash",
      transfer: ["Find the duplicate / missing numbers", "Any O(1)-space problem with values bounded by n", "Cycle detection in arrays (Find the Duplicate Number)"],
      name: "In-Place: Array Index as Hash",
      signals: [
        "Values are in range 1..n (or 0..n-1) for an array of size n",
        "O(1) extra space required",
        "Find missing / duplicate numbers",
      ],
      approach:
        "Use the array itself as the hash table: place value v at index v-1 (cyclic sort), or flip the sign at index |v|-1 to mark 'seen'. Then scan for the first index that's out of place.",
      template: `for i in range(n):
    while 1 <= nums[i] <= n and nums[nums[i]-1] != nums[i]:
        j = nums[i]-1
        nums[i], nums[j] = nums[j], nums[i]`,
      variations: ["Sign-marking vs. cyclic swap", "Use first row/col as markers (Set Matrix Zeroes)"],
      pitfalls: ["Swap with the duplicate check or you loop forever", "Restore signs if the input must be preserved"],
      problems: [
        P("find-all-numbers-disappeared-in-an-array", "Find All Numbers Disappeared in an Array", "Easy", "Mark presence by negating nums[v-1]."),
        P("set-matrix-zeroes", "Set Matrix Zeroes", "Medium", "Reuse first row/column as flag storage."),
        P("first-missing-positive", "First Missing Positive", "Hard", "Answer is in 1..n+1, so cyclic-place values."),
      ],
    },
  ],
};

export const twoPointers: Topic = {
  id: "two-pointers",
  name: "Two Pointers",
  blurb:
    "Two indices that move with a rule, so you never revisit pairs you can prove are useless.",
  patterns: [
    {
      id: "opposite-ends",
      transfer: ["Palindrome checks and 'almost palindromes'", "4Sum / K-Sum (recursion over two pointers)", "Closest-sum variants, Two Sum on sorted input", "Max area / trapped water style 'two walls' problems"],
      name: "Opposite Ends (Converging)",
      signals: [
        "Sorted array + find a pair/triple with a target",
        "Palindrome check",
        "Maximize/minimize something determined by two endpoints",
      ],
      approach:
        "Start at both ends. Compare the current state to the goal and move the pointer whose move can only help (e.g. sum too big → move right inward). The proof that you discard no valid answer is the key insight.",
      template: `l, r = 0, n - 1
while l < r:
    s = a[l] + a[r]
    if s == target: ...
    elif s < target: l += 1
    else: r -= 1`,
      variations: [
        "k-Sum: fix k-2 elements, two-pointer the rest",
        "Greedy shrink: move the shorter wall (Container With Most Water)",
        "Skip duplicates after a match to avoid repeated triples",
      ],
      pitfalls: ["Sort first if not sorted (and you don't need original indices)", "Duplicate handling in 3Sum"],
      problems: [
        P("valid-palindrome", "Valid Palindrome", "Easy", "Skip non-alphanumerics from both sides."),
        P("two-sum-ii-input-array-is-sorted", "Two Sum II - Input Array Is Sorted", "Medium", "Sortedness lets you steer by comparing the sum."),
        P("3sum", "3Sum", "Medium", "Fix one, converge the other two, skip duplicates."),
        P("container-with-most-water", "Container With Most Water", "Medium", "Moving the taller wall can never help."),
        P("trapping-rain-water", "Trapping Rain Water", "Hard", "Water at i is bounded by the smaller running max side."),
      ],
    },
    {
      id: "read-write",
      transfer: ["Remove Element, Remove Duplicates II", "String compression and in-place filtering", "Partitioning even/odd or negative/positive"],
      name: "Same Direction (Slow/Fast, Read/Write)",
      signals: [
        "Modify array in place, keep relative order",
        "Remove / compact / dedupe elements",
        "O(1) extra space",
      ],
      approach:
        "`fast` scans every element; `slow` marks where the next kept element goes. Copy a[fast] to a[slow] only when it should be kept.",
      template: `slow = 0
for fast in range(n):
    if keep(a[fast]):
        a[slow] = a[fast]; slow += 1
return slow`,
      variations: ["Allow at most k duplicates: compare with a[slow-k]", "Move zeros: swap instead of overwrite"],
      pitfalls: ["Return value is the new length, not the last index"],
      problems: [
        P("remove-duplicates-from-sorted-array", "Remove Duplicates from Sorted Array", "Easy", "Compare a[fast] with a[slow-1]."),
        P("move-zeroes", "Move Zeroes", "Easy", "Swap non-zeros forward to preserve order."),
      ],
    },
    {
      id: "partition",
      transfer: ["Quicksort partition, Quickselect", "Segregate even/odd, negatives/positives", "Sort Colors with k colours"],
      name: "Partitioning (Dutch National Flag)",
      signals: ["Sort/group an array with few distinct values", "In-place, single pass"],
      approach:
        "Maintain three regions with pointers lo, mid, hi. Swap elements into the correct region; only advance mid when the swapped-in value is known to be handled.",
      template: `lo = mid = 0; hi = n - 1
while mid <= hi:
    if a[mid] == 0: swap(lo, mid); lo++; mid++
    elif a[mid] == 1: mid++
    else: swap(mid, hi); hi--`,
      variations: ["Quickselect partition", "Even/odd partition"],
      pitfalls: ["Don't advance mid after swapping with hi — the new value is unchecked"],
      problems: [P("sort-colors", "Sort Colors", "Medium", "Three-way partition in one pass.")],
    },
  ],
};

export const slidingWindow: Topic = {
  id: "sliding-window",
  name: "Sliding Window",
  blurb: "A contiguous range that grows and shrinks, maintaining a running summary instead of recomputing.",
  patterns: [
    {
      id: "fixed-window",
      transfer: ["Max/min/average over every k-length window", "Anagram and permutation detection", "Count windows satisfying a property (distinct elements, vowels)"],
      name: "Fixed-Size Window",
      signals: ["Subarray/substring of exactly length k", "Anagram / permutation of a pattern"],
      approach:
        "Build the first window, then slide by one: add the entering element, remove the leaving element, update the answer. For anagrams, compare frequency counts (or track a 'matches' counter).",
      template: `for i in range(n):
    add(a[i])
    if i >= k: remove(a[i - k])
    if i >= k - 1: update(ans)`,
      variations: ["Count array of 26 vs. map", "Track 'matches' to compare in O(1)"],
      pitfalls: ["Off-by-one on when the window becomes full"],
      problems: [
        P("maximum-average-subarray-i", "Maximum Average Subarray I", "Easy", "Maintain a running sum."),
        P("permutation-in-string", "Permutation in String", "Medium", "Fixed window + frequency equality."),
        P("find-all-anagrams-in-a-string", "Find All Anagrams in a String", "Medium", "Same, but collect every matching start."),
      ],
    },
    {
      id: "variable-longest",
      transfer: ["Longest substring with at most K distinct characters", "Longest subarray with sum ≤ S (non-negative)", "Longest ones/zeros with at most k flips"],
      name: "Variable Window: Longest Valid",
      signals: [
        "'Longest substring/subarray such that …'",
        "Constraint is monotone: shrinking a valid window keeps it valid",
        "At most K distinct / replacements / zeros",
      ],
      approach:
        "Expand right every step. While the window violates the constraint, shrink from the left. Record the best length after restoring validity.",
      template: `l = 0
for r in range(n):
    add(a[r])
    while invalid(): remove(a[l]); l += 1
    best = max(best, r - l + 1)`,
      variations: [
        "'At most K' counts; 'exactly K' = atMost(K) − atMost(K−1)",
        "Max-frequency trick: window valid if len − maxFreq ≤ k",
      ],
      pitfalls: ["Constraint must be monotone, else the shrink logic is invalid"],
      problems: [
        P("longest-substring-without-repeating-characters", "Longest Substring Without Repeating Characters", "Medium", "Shrink until the duplicate is gone."),
        P("max-consecutive-ones-iii", "Max Consecutive Ones III", "Medium", "Window with ≤ k zeros."),
        P("longest-repeating-character-replacement", "Longest Repeating Character Replacement", "Medium", "Valid iff len − maxFreq ≤ k."),
        P("fruit-into-baskets", "Fruit Into Baskets", "Medium", "Longest window with ≤ 2 distinct values."),
      ],
    },
    {
      id: "variable-shortest",
      transfer: ["Smallest subarray with sum ≥ S", "Shortest substring containing all required characters", "Minimum window containing both sequences"],
      name: "Variable Window: Shortest Valid",
      signals: ["'Minimum length subarray/substring that …'", "Covers all required characters / reaches a sum"],
      approach:
        "Expand right until the window becomes valid, then shrink from the left as far as it stays valid, recording the minimum at each valid state.",
      template: `l = 0
for r in range(n):
    add(a[r])
    while valid():
        best = min(best, r - l + 1)
        remove(a[l]); l += 1`,
      variations: ["Use a 'need' counter and a 'formed' counter for O(1) validity checks"],
      pitfalls: ["Update the answer *inside* the while loop"],
      problems: [
        P("minimum-size-subarray-sum", "Minimum Size Subarray Sum", "Medium", "Positive numbers → window sum is monotone."),
        P("minimum-window-substring", "Minimum Window Substring", "Hard", "Track how many required chars are satisfied."),
      ],
    },
    {
      id: "monotonic-deque",
      transfer: ["Max/min over any sliding range", "Optimizing DP transitions over the last k states", "Longest subarray with bounded max − min"],
      name: "Window + Monotonic Deque",
      signals: ["Max/min of every window of size k", "Need window extremum in O(1)"],
      approach:
        "Keep a deque of indices whose values are decreasing (for max). Pop from the back while the new value is bigger; pop from the front if it left the window. The front is always the max.",
      template: `dq = deque()
for i, x in enumerate(a):
    while dq and a[dq[-1]] <= x: dq.pop()
    dq.append(i)
    if dq[0] <= i - k: dq.popleft()
    if i >= k - 1: out.append(a[dq[0]])`,
      variations: ["Min version flips comparison", "Constrained subsequence sum / shortest subarray with sum ≥ K"],
      pitfalls: ["Store indices, not values, so you can expire them"],
      problems: [P("sliding-window-maximum", "Sliding Window Maximum", "Hard", "Deque of decreasing values gives max at the front.")],
    },
  ],
};

export const stack: Topic = {
  id: "stack",
  name: "Stack",
  blurb: "LIFO structure for nesting, undo, and 'nearest greater/smaller' relationships.",
  patterns: [
    {
      id: "matching-nesting",
      transfer: ["Parsing HTML/XML tags, nested expressions", "Longest valid parentheses", "Remove invalid parentheses (BFS/DFS)", "Undo/redo and browser history"],
      name: "Matching & Nested Structure",
      signals: ["Brackets / tags / nested expressions", "Evaluate or decode something with inner-to-outer order", "Undo the most recent thing"],
      approach:
        "Push openers (or partial state); when a closer arrives, pop and resolve the most recent unresolved opener. Anything left on the stack at the end is unmatched.",
      template: `st = []
for ch in s:
    if opener(ch): st.append(state)
    else:
        top = st.pop()
        combine(top, ch)`,
      variations: ["Stack of (count, string) for nested decoding", "Stack of operands for RPN", "Auxiliary stack tracking min"],
      pitfalls: ["Empty-stack pop on closer", "Non-empty stack at the end"],
      problems: [
        P("valid-parentheses", "Valid Parentheses", "Easy", "Closer must match the top of the stack."),
        P("min-stack", "Min Stack", "Medium", "Store (value, min so far) pairs."),
        P("evaluate-reverse-polish-notation", "Evaluate Reverse Polish Notation", "Medium", "Pop two operands, push result."),
        P("decode-string", "Decode String", "Medium", "Push (prefix, repeat) at '[', resolve at ']'."),
      ],
    },
    {
      id: "monotonic-stack",
      transfer: ["Stock span, next warmer day, next greater element", "Largest rectangle and maximal rectangle", "Sum of subarray minimums/maximums", "Lexicographically smallest subsequence"],
      name: "Monotonic Stack (Next Greater / Smaller)",
      signals: [
        "Next/previous greater or smaller element",
        "'How many days until…', 'span', 'visible from…'",
        "Largest rectangle / area bounded by nearest smaller bars",
      ],
      approach:
        "Keep a stack of indices with monotone values. When the current element breaks the order, it is the answer ('next greater') for everything it pops. Each index is pushed and popped once → O(n).",
      template: `st = []  # indices, values decreasing
for i, x in enumerate(a):
    while st and a[st[-1]] < x:
        j = st.pop(); nxt[j] = i
    st.append(i)`,
      variations: [
        "Circular array: iterate 2n with i % n",
        "Both sides: popped element's left bound = new stack top, right bound = i (histogram area)",
        "Increasing vs. decreasing stack picks greater vs. smaller",
      ],
      pitfalls: ["Flush leftover elements with a sentinel (height 0) at the end", "Strict vs. non-strict comparison with duplicates"],
      problems: [
        P("next-greater-element-i", "Next Greater Element I", "Easy", "Classic next-greater with a map."),
        P("daily-temperatures", "Daily Temperatures", "Medium", "Answer = i − popped index."),
        P("car-fleet", "Car Fleet", "Medium", "Sort by position; stack of arrival times."),
        P("largest-rectangle-in-histogram", "Largest Rectangle in Histogram", "Hard", "Popped bar's width spans between nearest smaller bars."),
      ],
    },
  ],
};

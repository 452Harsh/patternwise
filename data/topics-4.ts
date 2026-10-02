import { P, type Pattern, type Topic } from "./types";

/* ---------- New topics ---------- */

export const strings: Topic = {
  id: "strings",
  name: "Strings",
  blurb: "Parsing, matching and character bookkeeping. Most string problems are arrays, hashing or DP in disguise.",
  patterns: [
    {
      id: "char-counting-mapping",
      name: "Character Counting & Mapping",
      signals: ["Anagram / permutation / rearrangement questions", "Two strings must correspond one-to-one (isomorphic, word pattern)", "Alphabet is small (26 letters)"],
      approach:
        "Reduce each string to a signature: a 26-slot count array, or a bijection stored in two maps. Compare signatures instead of comparing strings character by character.",
      variations: ["Count array vs. hash map", "Two-way map for bijection", "Custom ordering via a rank array"],
      pitfalls: ["One-way mapping lets two chars map to the same target", "Unicode vs. lowercase-only assumption"],
      transfer: ["Any 'same multiset' check", "Window problems that compare counts", "Frequency-based greedy (reorganize string)"],
      problems: [
        P("ransom-note", "Ransom Note", "Easy", "Count magazine letters, then spend them."),
        P("first-unique-character-in-a-string", "First Unique Character in a String", "Easy", "Two passes: count, then find first with count 1."),
        P("isomorphic-strings", "Isomorphic Strings", "Easy", "Mapping must be a bijection — check both directions."),
        P("custom-sort-string", "Custom Sort String", "Medium", "Count, then emit in the custom order."),
      ],
    },
    {
      id: "string-two-pointers",
      name: "Two Pointers on Strings / Subsequence",
      signals: ["Is A a subsequence of B?", "Compare strings after processing (backspaces)", "Palindrome with one deletion allowed"],
      approach: "One pointer per string, advance the one that can progress. For 'almost palindrome', on the first mismatch try skipping either side and check the rest exactly.",
      variations: ["Process from the end to handle backspaces in O(1) space", "In-place compression with read/write pointers"],
      pitfalls: ["Skipping logic when several consecutive backspaces occur"],
      transfer: ["Merge-like scans of two sorted arrays", "Matching a pattern greedily"],
      problems: [
        P("is-subsequence", "Is Subsequence", "Easy", "Advance the pattern pointer only on a match."),
        P("valid-palindrome-ii", "Valid Palindrome II", "Easy", "On mismatch, try deleting either side."),
        P("backspace-string-compare", "Backspace String Compare", "Easy", "Walk both strings from the end."),
        P("string-compression", "String Compression", "Medium", "Read/write pointers with run lengths."),
      ],
    },
    {
      id: "parsing-simulation",
      name: "Parsing & Big-Number Simulation",
      signals: ["Implement atoi / add or multiply numbers given as strings", "Follow detailed rules exactly", "Input too large for built-in integers"],
      approach: "Do what you'd do by hand: process digits right-to-left with a carry, or left-to-right with state flags. List the edge cases (sign, whitespace, overflow, leading zeros) before coding.",
      variations: ["Result array of size m+n for multiplication", "State machine for number parsing"],
      pitfalls: ["Overflow clamping", "Leading zeros in the output", "Off-by-one on carry at the end"],
      transfer: ["Add Binary / Plus One", "Any 'implement X by hand' question"],
      problems: [
        P("longest-common-prefix", "Longest Common Prefix", "Easy", "Compare column by column."),
        P("add-strings", "Add Strings", "Easy", "Digit by digit with a carry."),
        P("reverse-words-in-a-string", "Reverse Words in a String", "Medium", "Split on whitespace, reverse, join."),
        P("string-to-integer-atoi", "String to Integer (atoi)", "Medium", "Trim, sign, digits, clamp."),
        P("multiply-strings", "Multiply Strings", "Medium", "pos[i+j+1] accumulates digit products."),
      ],
    },
    {
      id: "string-matching",
      name: "Substring Matching (KMP / Rolling Hash)",
      signals: ["Find a pattern inside a text in linear time", "Detect repeated substrings", "Duplicate substring of length L / longest duplicate"],
      approach:
        "KMP: precompute the failure (LPS) array so the text pointer never moves backwards. Rolling hash (Rabin-Karp): hash each window in O(1) from the previous one, verify on a hash hit. Combine rolling hash with binary search on length for 'longest duplicate'.",
      template: `lps = [0] * m
k = 0
for i in range(1, m):
    while k and p[i] != p[k]: k = lps[k - 1]
    if p[i] == p[k]: k += 1
    lps[i] = k`,
      variations: ["Z-function as an alternative to LPS", "Fixed-length hash windows into a set", "Pattern trick: s repeats iff s in (s+s)[1:-1]"],
      pitfalls: ["Hash collisions: verify or use a double hash", "Modular arithmetic with negative values"],
      transfer: ["Shortest palindrome via LPS of s + '#' + reverse(s)", "Any problem needing 'longest prefix that is also suffix'"],
      problems: [
        P("find-the-index-of-the-first-occurrence-in-a-string", "Find the Index of the First Occurrence in a String", "Easy", "Implement KMP once."),
        P("repeated-substring-pattern", "Repeated Substring Pattern", "Easy", "Period = n − lps[n−1] must divide n."),
        P("repeated-dna-sequences", "Repeated DNA Sequences", "Medium", "Fixed window of 10 + set (or rolling hash)."),
        P("shortest-palindrome", "Shortest Palindrome", "Hard", "Longest palindromic prefix via LPS."),
        P("longest-duplicate-substring", "Longest Duplicate Substring", "Hard", "Binary search length + rolling hash."),
      ],
    },
  ],
};

export const prefixSum: Topic = {
  id: "prefix-sum",
  name: "Prefix Sum & Difference Array",
  blurb: "Precompute cumulative information once so every range query or range update becomes O(1).",
  patterns: [
    {
      id: "prefix-basics",
      name: "Prefix Sum for Range Queries",
      signals: ["Many sum queries over ranges", "Balance point / equal left and right sums", "Static array (no updates)"],
      approach: "prefix[i] = sum of first i elements, so sum(l..r) = prefix[r+1] − prefix[l]. Use a leading 0 to avoid special-casing l = 0.",
      template: `prefix = [0]
for x in a: prefix.append(prefix[-1] + x)
range_sum = lambda l, r: prefix[r + 1] - prefix[l]`,
      variations: ["Prefix XOR, prefix product, prefix count of a property", "Left/right running totals instead of a stored array"],
      pitfalls: ["Off-by-one between inclusive and exclusive ends", "Array with updates needs a Fenwick/segment tree instead"],
      transfer: ["Any 'sum over a range' that repeats", "Prefix max/min for 'best so far' (Trapping Rain Water)"],
      problems: [
        P("range-sum-query-immutable", "Range Sum Query - Immutable", "Easy", "The canonical prefix array."),
        P("find-pivot-index", "Find Pivot Index", "Easy", "Left sum == total − left − x."),
      ],
    },
    {
      id: "prefix-hash",
      name: "Prefix Sum + Hash Map (Subarray Counting)",
      signals: ["Count / find subarrays with sum = K or divisible by K", "Array can contain negatives (so sliding window fails)", "Longest subarray with equal counts"],
      approach:
        "prefix[j] − prefix[i] = K means an earlier prefix equals prefix[j] − K. Keep a map of prefix → count (or first index) as you scan. Seed the map with {0: 1}.",
      template: `count = {0: 1}; run = 0; ans = 0
for x in nums:
    run += x
    ans += count.get(run - k, 0)
    count[run] = count.get(run, 0) + 1`,
      variations: ["Prefix mod K for divisibility (normalize negative remainders)", "Store first index for the longest subarray", "Transform values (0 → −1) so equal counts becomes sum 0"],
      pitfalls: ["Forgetting the {0: 1} seed", "Using a sliding window when negatives exist"],
      transfer: ["Count nodes on a tree path with a given sum (Path Sum III)", "2D version with row-pair compression", "Longest well-performing interval"],
      problems: [
        P("subarray-sum-equals-k", "Subarray Sum Equals K", "Medium", "Count earlier prefixes equal to run − k."),
        P("contiguous-array", "Contiguous Array", "Medium", "Map 0→−1, find the longest zero-sum subarray."),
        P("subarray-sums-divisible-by-k", "Subarray Sums Divisible by K", "Medium", "Count equal prefix remainders."),
        P("product-of-array-except-self", "Product of Array Except Self", "Medium", "Prefix and suffix products, no division."),
      ],
    },
    {
      id: "difference-array",
      name: "Difference Array (Range Updates)",
      signals: ["Many 'add v to range [l, r]' updates, one final read", "Bookings, capacity, flights, coverage counts"],
      approach: "Record +v at l and −v at r+1 in a difference array; one prefix-sum pass at the end reconstructs the final values. Turns O(n) per update into O(1).",
      template: `diff = [0] * (n + 1)
for l, r, v in updates:
    diff[l] += v; diff[r + 1] -= v
# final[i] = running sum of diff`,
      variations: ["Sweep over sorted event points instead of a dense array", "2D difference array"],
      pitfalls: ["r+1 can be out of range — size the array n+1"],
      transfer: ["Meeting rooms / max overlap (events sweep)", "Painting or covering ranges"],
      problems: [
        P("corporate-flight-bookings", "Corporate Flight Bookings", "Medium", "Difference array then prefix sum."),
        P("car-pooling", "Car Pooling", "Medium", "+passengers at pickup, −passengers at drop-off."),
      ],
    },
    {
      id: "prefix-2d",
      name: "2D Prefix Sum",
      signals: ["Sum of a rectangular submatrix", "Many rectangle queries"],
      approach: "P[i][j] = a[i-1][j-1] + P[i-1][j] + P[i][j-1] − P[i-1][j-1]. A rectangle sum then uses inclusion–exclusion on four corners.",
      variations: ["Block sums with clamped borders"],
      pitfalls: ["Inclusion–exclusion sign errors", "1-based padding"],
      transfer: ["Count submatrices with a given sum (compress rows + 1D prefix hash)"],
      problems: [
        P("range-sum-query-2d-immutable", "Range Sum Query 2D - Immutable", "Medium", "Inclusion–exclusion on a prefix grid."),
        P("matrix-block-sum", "Matrix Block Sum", "Medium", "Clamp the window to the matrix, then use the prefix grid."),
      ],
    },
  ],
};

export const sorting: Topic = {
  id: "sorting",
  name: "Sorting",
  blurb: "Know how the standard sorts work and when sorting (or a custom order) is the key insight.",
  patterns: [
    {
      id: "implement-sorts",
      name: "Implementing Merge Sort / Quick Sort",
      signals: ["Sort without built-ins", "Sort a linked list in O(n log n) and O(1) space", "Stable sort or divide-and-conquer on sorted halves"],
      approach:
        "Merge sort: split, sort halves, merge two sorted runs (stable, O(n log n) always). Quick sort: pick a pivot, partition, recurse (average O(n log n), worst O(n²) — randomize the pivot). Linked lists favour merge sort.",
      variations: ["3-way partition for many duplicates", "Bottom-up merge sort", "Quickselect for k-th element in expected O(n)", "Heap sort for O(1) extra space"],
      pitfalls: ["Worst-case pivot on already sorted data", "Merge step off-by-one"],
      transfer: ["Counting inversions during the merge step", "Quickselect for Kth largest"],
      problems: [
        P("merge-sorted-array", "Merge Sorted Array", "Easy", "Merge from the back to avoid overwriting."),
        P("sort-an-array", "Sort an Array", "Medium", "Implement merge sort or heap sort yourself."),
        P("sort-list", "Sort List", "Medium", "Find middle, sort halves, merge."),
        P("reverse-pairs", "Reverse Pairs", "Hard", "Count cross pairs during merge sort."),
      ],
    },
    {
      id: "custom-comparator",
      name: "Sort by a Custom Key / Comparator",
      signals: ["Arrange items to form the largest/smallest result", "Order by frequency, then by value", "Greedy that is correct only after sorting"],
      approach: "Decide the ordering rule, then prove adjacent-swap optimality: for strings a and b, a goes first if a+b > b+a. Sort by that key and the greedy follows.",
      variations: ["Sort by multiple keys", "Sort indices instead of values", "Counting sort when the key range is small"],
      pitfalls: ["Comparator must be a consistent total order", "Leading zeros in 'largest number'"],
      transfer: ["Task assignment and interval scheduling greedy", "Meeting-room style problems"],
      problems: [
        P("relative-sort-array", "Relative Sort Array", "Easy", "Rank by position in the reference array."),
        P("sort-characters-by-frequency", "Sort Characters By Frequency", "Medium", "Count, then sort by count."),
        P("h-index", "H-Index", "Medium", "Sort descending, find the last index with c ≥ rank."),
        P("largest-number", "Largest Number", "Medium", "Comparator: a+b vs b+a."),
      ],
    },
    {
      id: "bucket-sort",
      name: "Bucket / Counting Sort Tricks",
      signals: ["Values or gaps bounded by n", "Need O(n) when comparison sorting is too slow", "Nearly-equal values (within t)"],
      approach: "Place values into buckets sized so the answer must straddle bucket boundaries (pigeonhole). For maximum gap, bucket size = (max−min)/(n−1); only compare bucket min/max across neighbours.",
      variations: ["Counting sort for small integer ranges", "Radix sort digit by digit"],
      pitfalls: ["Bucket-size zero when all values are equal"],
      transfer: ["Top K Frequent (bucket by frequency)", "Sort Colors"],
      problems: [
        P("maximum-gap", "Maximum Gap", "Medium", "Pigeonhole: the max gap spans buckets."),
        P("contains-duplicate-iii", "Contains Duplicate III", "Hard", "Buckets of width t+1 in a sliding window."),
      ],
    },
  ],
};

export const monotonicExtras: Pattern[] = [
  {
    id: "monotonic-stack-contribution",
    name: "Monotonic Stack: Contribution & Spans",
    signals: ["Sum over all subarrays of min/max", "Span: how many consecutive previous days ≤ today", "Largest rectangle of 1s in a matrix (histogram per row)"],
    approach: "For each element find the nearest smaller (or greater) element on each side. The element is the min/max of (left_gap × right_gap) subarrays; multiply by its value and add. Use strict on one side, non-strict on the other to avoid double-counting ties.",
    variations: ["Circular arrays via two passes", "Maximal Rectangle: run histogram per row"],
    pitfalls: ["Tie handling (one side strict, one side ≤)", "Modulo on large sums"],
    transfer: ["Largest Rectangle in Histogram", "Trapping Rain Water", "Stock span style questions"],
    problems: [
      P("online-stock-span", "Online Stock Span", "Medium", "Stack of (price, span) pairs."),
      P("next-greater-element-ii", "Next Greater Element II", "Medium", "Circular scan with i % n."),
      P("sum-of-subarray-minimums", "Sum of Subarray Minimums", "Medium", "Left/right nearest-smaller distances."),
      P("maximal-rectangle", "Maximal Rectangle", "Hard", "Histogram of heights per row."),
    ],
  },
  {
    id: "monotonic-stack-greedy",
    name: "Monotonic Stack: Lexicographic Greedy",
    signals: ["Remove k digits/characters to get the smallest result", "Smallest subsequence containing each letter once", "Pattern like i < k < j with a[k] < a[i] < a[j]"],
    approach: "Keep the stack increasing. When a smaller character arrives, pop larger ones if you are still allowed to (budget k left, or the popped char appears again later). Push the new char.",
    variations: ["Track 'last occurrence' and 'in stack' to remove duplicates", "Scan right-to-left for the 132 pattern with a 'third' candidate"],
    pitfalls: ["Strip leftover removals from the end", "Strip leading zeros"],
    transfer: ["Create Maximum Number", "Smallest subsequence of distinct characters"],
    problems: [
      P("remove-k-digits", "Remove K Digits", "Medium", "Pop bigger digits while k > 0."),
      P("remove-duplicate-letters", "Remove Duplicate Letters", "Medium", "Pop only if the char reappears later."),
      P("132-pattern", "132 Pattern", "Medium", "Right-to-left with a decreasing stack and a 'third' value."),
    ],
  },
  {
    id: "monotonic-deque-dp",
    name: "Monotonic Deque: Optimize DP & Prefix Windows",
    signals: ["DP transition takes the max/min over the previous k states", "Shortest subarray with sum ≥ K (negatives allowed)", "Longest window where max − min ≤ limit"],
    approach: "Keep a deque of candidate indices ordered by value. The front is the best candidate inside the window; pop from the back anything that can never beat the new element. Turns an O(nk) DP transition into O(n).",
    variations: ["Deque over prefix sums for shortest subarray ≥ K", "Two deques (max and min) for window range"],
    pitfalls: ["Store indices, expire from the front by index"],
    transfer: ["Sliding Window Maximum", "Jump Game VI", "Any DP of form dp[i] = a[i] + max(dp[i-k..i-1])"],
    problems: [
      P("longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit", "Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit", "Medium", "Max-deque + min-deque."),
      P("constrained-subsequence-sum", "Constrained Subsequence Sum", "Hard", "dp[i] = a[i] + max(0, window max of dp)."),
      P("shortest-subarray-with-sum-at-least-k", "Shortest Subarray with Sum at Least K", "Hard", "Deque of increasing prefix sums."),
    ],
  },
];

export const stackQueueExtras: Pattern[] = [
  {
    id: "expression-evaluation",
    name: "Expression Evaluation & Path Simplification",
    signals: ["Calculator with + − * / and parentheses", "Simplify a file path", "Operators with precedence"],
    approach: "Keep a stack of numbers; apply high-precedence operators immediately, defer + and − by pushing signed values. For parentheses push the running result and sign, then restore at ')'.",
    variations: ["Two stacks (values + operators) for the general case", "Recursion for parentheses"],
    pitfalls: ["Integer division truncation toward zero", "Multi-digit numbers and spaces"],
    transfer: ["Decode String", "Parsing nested structures"],
    problems: [
      P("simplify-path", "Simplify Path", "Medium", "Push names, pop on '..'."),
      P("basic-calculator-ii", "Basic Calculator II", "Medium", "Resolve * and / immediately; push signed terms."),
      P("basic-calculator", "Basic Calculator", "Hard", "Push (result, sign) at '(' and restore at ')'."),
    ],
  },
  {
    id: "stack-simulation",
    name: "Stack as Simulation (Collisions, Adjacent Removal)",
    signals: ["Items interact only with their immediate neighbour", "Repeatedly remove adjacent pairs", "Things moving in opposite directions collide"],
    approach: "Scan once; compare each new item to the stack top and resolve interaction (cancel, merge, destroy) in a loop before pushing.",
    variations: ["Store (char, count) to remove k-adjacent duplicates"],
    pitfalls: ["Loop (while) on resolution, not just a single comparison"],
    transfer: ["Valid Parentheses", "Backspace String Compare"],
    problems: [
      P("remove-all-adjacent-duplicates-in-string", "Remove All Adjacent Duplicates In String", "Easy", "Pop if the top equals the new char."),
      P("asteroid-collision", "Asteroid Collision", "Medium", "Right-mover on top meets left-mover: compare sizes."),
    ],
  },
  {
    id: "queue-design",
    name: "Queue / Deque Design",
    signals: ["Implement a queue with stacks or a stack with queues", "Fixed-size ring buffer", "Count events in the last N units of time"],
    approach: "Two stacks with lazy transfer give amortized O(1) for a queue. A ring buffer needs head index + size. A time window is a queue where you pop expired events from the front.",
    variations: ["One queue and rotate for stack-by-queue", "Monotonic deque for window max"],
    pitfalls: ["Move between stacks only when the output stack is empty"],
    transfer: ["Sliding window problems", "BFS implementations"],
    problems: [
      P("implement-queue-using-stacks", "Implement Queue using Stacks", "Easy", "Lazy transfer from in-stack to out-stack."),
      P("implement-stack-using-queues", "Implement Stack using Queues", "Easy", "Rotate the queue after each push."),
      P("number-of-recent-calls", "Number of Recent Calls", "Easy", "Pop timestamps older than t − 3000."),
      P("design-circular-queue", "Design Circular Queue", "Medium", "Head index + count with modulo."),
    ],
  },
];

export const arraysExtras: Pattern[] = [
  {
    id: "boyer-moore",
    name: "Voting & Counting Tricks (Boyer–Moore)",
    signals: ["Element that appears more than n/2 (or n/3) times", "O(1) space majority"],
    approach: "Keep a candidate and a counter: matching element increments, others decrement; at zero take a new candidate. A majority element always survives the cancellation. Verify with a second pass when a majority isn't guaranteed.",
    variations: ["n/3 needs two candidates and two counters"],
    pitfalls: ["Forgetting the verification pass when no majority is guaranteed"],
    transfer: ["Cancellation arguments in other 'pair off' problems"],
    problems: [
      P("majority-element", "Majority Element", "Easy", "Cancel pairs of different elements."),
      P("majority-element-ii", "Majority Element II", "Medium", "Two candidates for n/3."),
    ],
  },
  {
    id: "array-rearrangement",
    name: "In-Place Rearrangement (Rotate / Permute)",
    signals: ["Rotate an array by k in O(1) space", "Next lexicographic arrangement", "Rearrange without extra array"],
    approach: "Rotation by k: reverse the whole array, then reverse the first k and last n−k. Next permutation: find the rightmost ascent, swap with the next larger suffix element, reverse the suffix.",
    variations: ["Cyclic replacement by following cycles"],
    pitfalls: ["k larger than n: use k %= n", "Descending array wraps to ascending"],
    transfer: ["Reverse words in a string", "Rotate matrix layers"],
    problems: [
      P("rotate-array", "Rotate Array", "Medium", "Three reversals."),
      P("next-permutation", "Next Permutation", "Medium", "Find the pivot, swap, reverse the suffix."),
    ],
  },
];

export const twoPointersExtras: Pattern[] = [
  {
    id: "two-sequences",
    name: "Two Pointers Across Two Arrays",
    signals: ["Two sorted arrays", "Intersect / merge / compare sequences", "Squares of a sorted array with negatives"],
    approach: "One pointer per array (or both ends of one array), advance the smaller side. For squares, the largest square is at one of the ends, so fill the output from the back.",
    variations: ["Sort first when input is unsorted", "Hash count when sorting is not allowed"],
    pitfalls: ["Duplicates in intersection results"],
    transfer: ["Merge sorted arrays / lists", "Interval list intersections"],
    problems: [
      P("squares-of-a-sorted-array", "Squares of a Sorted Array", "Easy", "Compare absolute values at both ends."),
      P("intersection-of-two-arrays-ii", "Intersection of Two Arrays II", "Easy", "Sorted two-pointer or count map."),
    ],
  },
];

export const slidingExtras: Pattern[] = [
  {
    id: "at-most-k",
    name: "Counting Subarrays: atMost(K) − atMost(K−1)",
    signals: ["Count subarrays with exactly K distinct / K odd numbers / sum K", "Condition is monotone, but 'exactly' is not"],
    approach: "'At most K' is monotone, so a standard variable window counts it: for each right end, add (r − l + 1) subarrays. Then exactly(K) = atMost(K) − atMost(K−1).",
    template: `def at_most(k):
    l = res = 0
    for r in range(n):
        add(a[r])
        while bad(k): remove(a[l]); l += 1
        res += r - l + 1
    return res
return at_most(K) - at_most(K - 1)`,
    variations: ["Binary arrays (sum K)", "Convert odd/even to 1/0"],
    pitfalls: ["K = 0 edge case: atMost(−1) must return 0"],
    transfer: ["Any 'exactly' counting problem with monotone 'at most' version"],
    problems: [
      P("binary-subarrays-with-sum", "Binary Subarrays With Sum", "Medium", "atMost(S) − atMost(S−1)."),
      P("count-number-of-nice-subarrays", "Count Number of Nice Subarrays", "Medium", "Map odd → 1, then the same trick."),
      P("subarrays-with-k-different-integers", "Subarrays with K Different Integers", "Hard", "atMost(K) − atMost(K−1) with a count map."),
    ],
  },
];

export const bsExtras: Pattern[] = [
  {
    id: "binary-search-implicit",
    name: "Binary Search on Slope / Implicit Order",
    signals: ["Peak element, mountain, 'find any local maximum'", "Unsorted but with a guaranteed structure", "Find the k closest to x in a sorted array", "Sorted matrix where rows and columns are sorted"],
    approach: "Compare a[mid] with a neighbour to learn which direction goes uphill (or which half is odd-sized) and keep that half. For k-closest, binary search the window's left boundary using a[mid] vs. a[mid+k].",
    variations: ["Binary search on value range with a count-≤-x function (kth smallest in matrix)", "Parity trick for the single non-duplicate element"],
    pitfalls: ["Neighbour access at the ends", "Choose hi = mid, not mid − 1, for peak search"],
    transfer: ["Any problem with a monotone predicate hidden in the structure", "Median / k-th element via counting"],
    problems: [
      P("sqrtx", "Sqrt(x)", "Easy", "Largest m with m*m ≤ x."),
      P("find-peak-element", "Find Peak Element", "Medium", "Move toward the larger neighbour."),
      P("single-element-in-a-sorted-array", "Single Element in a Sorted Array", "Medium", "Use index parity to pick the half."),
      P("find-k-closest-elements", "Find K Closest Elements", "Medium", "Binary search the window start."),
      P("kth-smallest-element-in-a-sorted-matrix", "Kth Smallest Element in a Sorted Matrix", "Medium", "Binary search the value; count entries ≤ mid."),
    ],
  },
];

export const linkedListExtras: Pattern[] = [
  {
    id: "pointer-rewiring",
    name: "Pointer Rewiring Variants",
    signals: ["Swap, partition, rotate, or interleave nodes", "Copy a list with extra pointers", "Find where two lists meet"],
    approach: "Build the result with two or more dummy-headed lists (odd/even, small/large) and stitch them at the end. For intersection, run two pointers that switch lists on reaching null so they align. For random pointers, interleave copies or use an old→new map.",
    variations: ["Rotate: make it a ring, break at n − k", "Interleave copy nodes to get O(1) extra space"],
    pitfalls: ["Terminate the tail (next = null) to avoid cycles", "k > length: use k %= length"],
    transfer: ["Reorder List", "Merge Two Sorted Lists", "Any 'partition by predicate' on a list"],
    problems: [
      P("intersection-of-two-linked-lists", "Intersection of Two Linked Lists", "Easy", "Pointers switch heads to equalize length."),
      P("swap-nodes-in-pairs", "Swap Nodes in Pairs", "Medium", "Dummy head; rewire in pairs."),
      P("odd-even-linked-list", "Odd Even Linked List", "Medium", "Two chains stitched together."),
      P("partition-list", "Partition List", "Medium", "Two dummy lists: < x and ≥ x."),
      P("rotate-list", "Rotate List", "Medium", "Close into a ring and cut at n − k."),
      P("copy-list-with-random-pointer", "Copy List with Random Pointer", "Medium", "Old→new map, or interleaved copies."),
    ],
  },
];

export const matrix: Topic = {
  id: "matrix",
  name: "Matrix & Grid Manipulation",
  blurb: "Index arithmetic and careful boundaries. (Grid BFS/DFS lives in Graphs; Grid DP lives in DP.)",
  patterns: [
    {
      id: "matrix-traversal",
      name: "Traversal Orders (Spiral, Diagonal)",
      signals: ["Visit cells in spiral / zigzag / diagonal order", "Four boundaries that shrink"],
      approach: "Maintain top, bottom, left, right bounds; walk each side then shrink the bound, re-checking that the remaining region is non-empty. Diagonals share r + c; zigzag flips direction each diagonal.",
      variations: ["Direction vector array with turn-on-boundary", "Generate a spiral matrix instead of reading one"],
      pitfalls: ["Duplicate visits when one row or column remains", "Empty matrix"],
      transfer: ["Layer-by-layer matrix rotation", "Any boundary-shrinking simulation"],
      problems: [
        P("spiral-matrix", "Spiral Matrix", "Medium", "Four shrinking bounds."),
        P("spiral-matrix-ii", "Spiral Matrix II", "Medium", "Same walk, writing counters."),
        P("diagonal-traverse", "Diagonal Traverse", "Medium", "Cells on a diagonal share r + c."),
      ],
    },
    {
      id: "matrix-transform",
      name: "In-Place Transform (Rotate, Simulate)",
      signals: ["Rotate/transposed in place", "Update all cells simultaneously from old values", "Validate a board"],
      approach: "Rotate 90° clockwise = transpose then reverse each row. For simultaneous updates encode old and new state in the same cell (e.g. 2 = alive→dead). Validation uses sets keyed by row, column and box (r//3, c//3).",
      variations: ["Encode multiple states per cell with extra values", "Layer-by-layer 4-way swap"],
      pitfalls: ["Reading already-updated neighbours", "Box index formula in sudoku"],
      transfer: ["Set Matrix Zeroes", "Cellular automaton style simulations"],
      problems: [
        P("rotate-image", "Rotate Image", "Medium", "Transpose then reverse rows."),
        P("valid-sudoku", "Valid Sudoku", "Medium", "Sets for rows, columns and 3×3 boxes."),
        P("game-of-life", "Game of Life", "Medium", "Encode transitions in place."),
      ],
    },
    {
      id: "matrix-staircase",
      name: "Staircase Search (Sorted Rows & Columns)",
      signals: ["Matrix sorted by rows and by columns, but not fully flattened-sorted"],
      approach: "Start at the top-right (or bottom-left). If the cell is too big move left; too small move down. Each step discards a row or column: O(m + n).",
      variations: ["Binary search per row when only rows are sorted"],
      pitfalls: ["Starting at top-left gives no decisive direction"],
      transfer: ["Count entries ≤ x in a sorted matrix (used by Kth Smallest in Sorted Matrix)"],
      problems: [P("search-a-2d-matrix-ii", "Search a 2D Matrix II", "Medium", "Eliminate a row or column per step.")],
    },
  ],
};

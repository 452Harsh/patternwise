import { P, type Topic } from "./types";

export const binarySearch: Topic = {
  id: "binary-search",
  name: "Binary Search",
  blurb: "Halve the search space whenever you can answer 'which side?' — on indices or on the answer itself.",
  patterns: [
    {
      id: "classic-boundary",
      transfer: ["Lower/upper bound in any sorted structure", "First bad version, insert position", "Count occurrences = upper − lower bound"],
      name: "Classic & Boundary Search",
      signals: ["Sorted array", "Find first/last occurrence or insertion point", "O(log n) required"],
      approach:
        "Pick one invariant and stick to it. The safest form is 'find the first index where predicate(i) is true' using lo=0, hi=n, mid=(lo+hi)//2, and hi=mid / lo=mid+1.",
      template: `lo, hi = 0, n          # answer in [lo, hi]
while lo < hi:
    mid = (lo + hi) // 2
    if pred(mid): hi = mid
    else: lo = mid + 1
return lo`,
      variations: ["Lower bound vs. upper bound = change predicate (≥ x vs. > x)", "First and last position = two boundary searches"],
      pitfalls: ["Infinite loop from lo=mid with floor mid", "Mixing [lo,hi] and [lo,hi) conventions"],
      problems: [
        P("binary-search", "Binary Search", "Easy", "Get the loop invariant right once."),
        P("search-insert-position", "Search Insert Position", "Easy", "Lower bound = first index with a[i] ≥ target."),
        P("find-first-and-last-position-of-element-in-sorted-array", "Find First and Last Position of Element in Sorted Array", "Medium", "Two predicates: ≥ x and > x."),
      ],
    },
    {
      id: "rotated",
      transfer: ["Search in rotated array with duplicates", "Peak/valley finding", "Minimum in rotated array II"],
      name: "Rotated / Partially Sorted Array",
      signals: ["Sorted array rotated at an unknown pivot", "Exactly one half is always sorted"],
      approach:
        "At mid, decide which half is sorted by comparing a[lo], a[mid], a[hi]. Check whether the target (or the minimum) lies within the sorted half; discard the other half.",
      template: `while lo < hi:
    mid = (lo + hi) // 2
    if a[mid] > a[hi]: lo = mid + 1   # min is on the right
    else: hi = mid`,
      variations: ["With duplicates: when a[mid]==a[hi], do hi -= 1 (worst case O(n))", "Peak element in a mountain uses the same slope idea"],
      pitfalls: ["Strict vs. non-strict when comparing to a[lo]"],
      problems: [
        P("find-minimum-in-rotated-sorted-array", "Find Minimum in Rotated Sorted Array", "Medium", "Compare mid with hi to locate the pivot."),
        P("search-in-rotated-sorted-array", "Search in Rotated Sorted Array", "Medium", "Identify the sorted half, then range-check."),
      ],
    },
    {
      id: "search-on-answer",
      transfer: ["Minimize the maximum / maximize the minimum (aggressive cows, painters, magnetic force)", "Smallest divisor given a threshold", "Minimum days to make bouquets, ship packages, split arrays"],
      name: "Binary Search on the Answer",
      signals: [
        "'Minimum possible maximum' / 'maximum possible minimum'",
        "Feasibility of a candidate answer x is easy to check in O(n)",
        "Feasibility is monotone in x",
      ],
      approach:
        "Define the answer range [lo, hi]. Write feasible(x) as a greedy O(n) check. Binary search for the smallest x where feasible(x) is true.",
      template: `lo, hi = min_possible, max_possible
while lo < hi:
    mid = (lo + hi) // 2
    if feasible(mid): hi = mid
    else: lo = mid + 1
return lo`,
      variations: ["Max-min version flips the direction and uses mid = (lo+hi+1)//2", "Floating-point answers: iterate a fixed number of times"],
      pitfalls: ["Wrong bounds (lo must be at least the largest single item)", "Non-monotone feasibility"],
      problems: [
        P("koko-eating-bananas", "Koko Eating Bananas", "Medium", "Feasible if sum(ceil(p/k)) ≤ h."),
        P("capacity-to-ship-packages-within-d-days", "Capacity To Ship Packages Within D Days", "Medium", "Greedy day-count as the feasibility check."),
        P("split-array-largest-sum", "Split Array Largest Sum", "Hard", "Same shape: minimize the maximum partition sum."),
      ],
    },
    {
      id: "matrix-partition",
      transfer: ["Median/k-th element of multiple sorted arrays", "Kth smallest in a sorted matrix", "Partition-point searches on sorted structures"],
      name: "2D Matrix & Partition Search",
      signals: ["Sorted matrix", "Median of two sorted arrays", "Search by partitioning rather than by value"],
      approach:
        "Treat a sorted matrix as a flattened array (row = i // cols, col = i % cols). For medians, binary search the partition point in the smaller array so left halves have the right size and cross-comparisons hold.",
      variations: ["Staircase search from a corner for row+col sorted matrices"],
      pitfalls: ["Empty partition edges need ±∞ sentinels"],
      problems: [
        P("search-a-2d-matrix", "Search a 2D Matrix", "Medium", "Index math turns it into 1D."),
        P("median-of-two-sorted-arrays", "Median of Two Sorted Arrays", "Hard", "Binary search the cut in the shorter array."),
      ],
    },
  ],
};

export const linkedList: Topic = {
  id: "linked-list",
  name: "Linked List",
  blurb: "Pointer manipulation: draw it, then rewire carefully.",
  patterns: [
    {
      id: "fast-slow",
      transfer: ["Happy Number (cycle in a number sequence)", "Find the Duplicate Number", "Palindrome list (find the middle first)", "Detecting cycles in any functional graph (next[i])"],
      name: "Fast & Slow Pointers",
      signals: ["Cycle detection", "Find the middle / k-th from end", "Detect a duplicate in an array treated as a functional graph"],
      approach:
        "Slow moves 1, fast moves 2. If they meet, there's a cycle. To find the cycle start, reset one pointer to the head and move both 1 step at a time; they meet at the entrance. Fast reaching the end means the slow is at the middle.",
      template: `slow = fast = head
while fast and fast.next:
    slow = slow.next; fast = fast.next.next
    if slow is fast: ...`,
      variations: ["Array-as-linked-list: next(i) = a[i]", "Gap of n between pointers to reach nth-from-end"],
      pitfalls: ["Null checks on fast.next", "Middle for even length: which one do you need?"],
      problems: [
        P("linked-list-cycle", "Linked List Cycle", "Easy", "If they meet, there's a cycle."),
        P("middle-of-the-linked-list", "Middle of the Linked List", "Easy", "When fast ends, slow is at the middle."),
        P("linked-list-cycle-ii", "Linked List Cycle II", "Medium", "Reset one pointer to head to find the entrance."),
        P("find-the-duplicate-number", "Find the Duplicate Number", "Medium", "Treat i → a[i] as a graph with a cycle."),
      ],
    },
    {
      id: "reversal",
      transfer: ["Reverse words in a string / array rotation by reversals", "Reorder list, palindrome list", "Reverse nodes in k-group, swap pairs"],
      name: "In-Place Reversal",
      signals: ["Reverse all / part / groups of a list", "Palindrome check in O(1) space", "Reorder using the reversed second half"],
      approach:
        "Keep prev, curr, next. For each node: save next, point curr.next at prev, advance. For sub-ranges, track the node before the range and reconnect both ends afterwards.",
      template: `prev, curr = None, head
while curr:
    nxt = curr.next
    curr.next = prev
    prev, curr = curr, nxt
return prev`,
      variations: ["Reverse between positions m..n", "Reverse in groups of k (recursion or iterative with a group check)", "Split at middle + reverse second half + compare/merge"],
      pitfalls: ["Losing the next pointer", "Reconnecting the head and tail of a reversed segment"],
      problems: [
        P("reverse-linked-list", "Reverse Linked List", "Easy", "The three-pointer dance."),
        P("palindrome-linked-list", "Palindrome Linked List", "Easy", "Middle + reverse second half + compare."),
        P("reorder-list", "Reorder List", "Medium", "Find middle, reverse, interleave."),
        P("reverse-linked-list-ii", "Reverse Linked List II", "Medium", "Reverse a sub-range, then reconnect."),
        P("reverse-nodes-in-k-group", "Reverse Nodes in k-Group", "Hard", "Check k nodes exist, reverse, link groups."),
      ],
    },
    {
      id: "dummy-node",
      transfer: ["Remove Linked List Elements, Delete Duplicates", "Partition List, Merge K lists", "Any list edit where the head may change"],
      name: "Dummy Head & Merge / Remove",
      signals: ["Head might change (deletion, insertion, merge)", "Build a new list from pieces", "Add numbers stored as lists"],
      approach:
        "Create a dummy node before the head so the first node isn't a special case. Build with a tail pointer. For 'remove nth from end', advance fast n steps ahead, then move both.",
      template: `dummy = tail = Node(0)
while a and b:
    if a.val <= b.val: tail.next, a = a, a.next
    else: tail.next, b = b, b.next
    tail = tail.next
tail.next = a or b
return dummy.next`,
      variations: ["Carry digit for addition", "Merge k lists with a heap (see Heap)"],
      pitfalls: ["Forgetting to return dummy.next", "Leftover carry after both lists end"],
      problems: [
        P("merge-two-sorted-lists", "Merge Two Sorted Lists", "Easy", "Dummy + tail splice."),
        P("remove-nth-node-from-end-of-list", "Remove Nth Node From End of List", "Medium", "Two pointers n apart; dummy handles head removal."),
        P("add-two-numbers", "Add Two Numbers", "Medium", "Digit-by-digit with a carry."),
      ],
    },
  ],
};

export const trees: Topic = {
  id: "trees",
  name: "Trees",
  blurb: "Recursion shaped like the data. Decide what each node returns and what it asks of its children.",
  patterns: [
    {
      id: "dfs-bottom-up",
      subtopic: "Recursion on trees",
      transfer: ["Diameter/height of N-ary trees and graphs", "Maximum path sum variants", "LCA and subtree-property problems", "Tree DP (House Robber III, Binary Tree Cameras)"],
      name: "DFS: Bottom-Up (Return Info to Parent)",
      signals: ["Height, diameter, balance, path sum, LCA", "The answer at a node depends on answers from both children", "'Best path' that may bend at a node"],
      approach:
        "Recurse to children first, combine their returned values, update a global/nonlocal answer using both children, and return only what the *parent* can use (e.g. a single downward path).",
      template: `def dfs(node):
    if not node: return 0
    L, R = dfs(node.left), dfs(node.right)
    best = max(best, L + R + node.val)   # path bends here
    return node.val + max(L, R)          # path continues up`,
      variations: ["Return a tuple (balanced, height)", "Clamp negatives with max(0, child)", "LCA: return the node if found on a side"],
      pitfalls: ["Confusing what you *return* with what you *record*"],
      problems: [
        P("maximum-depth-of-binary-tree", "Maximum Depth of Binary Tree", "Easy", "1 + max(left, right)."),
        P("invert-binary-tree", "Invert Binary Tree", "Easy", "Swap children after (or before) recursing."),
        P("balanced-binary-tree", "Balanced Binary Tree", "Easy", "Return height, or -1 as an 'unbalanced' signal."),
        P("diameter-of-binary-tree", "Diameter of Binary Tree", "Easy", "Record L+R, return 1+max(L,R)."),
        P("lowest-common-ancestor-of-a-binary-tree", "Lowest Common Ancestor of a Binary Tree", "Medium", "First node with a hit on both sides."),
        P("binary-tree-maximum-path-sum", "Binary Tree Maximum Path Sum", "Hard", "Record bent path, return straight path."),
      ],
    },
    {
      id: "dfs-top-down",
      subtopic: "Recursion on trees",
      transfer: ["Root-to-leaf path problems with running state", "Validate BST, count good nodes", "Path sum with prefix hash map"],
      name: "DFS: Top-Down (Pass State Down)",
      signals: ["Constraint depends on ancestors", "Track running sum / max-so-far / valid range along the path"],
      approach: "Pass extra parameters down (bounds, running value). Each node checks itself against the inherited state, then passes updated state to children.",
      template: `def dfs(node, lo, hi):
    if not node: return True
    if not (lo < node.val < hi): return False
    return dfs(node.left, lo, node.val) and dfs(node.right, node.val, hi)`,
      variations: ["Validate a BST with (lo, hi) bounds (see Binary Search Trees)", "Path sum with a prefix-sum map (undo the map entry on the way back up)"],
      pitfalls: ["Comparing a node only to its parent, not the full ancestor range", "Forgetting to undo path state when returning from a child"],
      problems: [
        P("path-sum", "Path Sum", "Easy", "Subtract the node value as you go down."),
        P("count-good-nodes-in-binary-tree", "Count Good Nodes in Binary Tree", "Medium", "Pass the max seen so far."),
        P("sum-root-to-leaf-numbers", "Sum Root to Leaf Numbers", "Medium", "Build the number digit by digit on the way down."),
        P("path-sum-iii", "Path Sum III", "Medium", "Prefix-sum hash map along the current root path."),
      ],
    },
    {
      id: "bfs-level",
      subtopic: "Traversals",
      transfer: ["Shortest path in an unweighted graph/grid", "Minimum depth, connect next-right pointers", "Level averages, rightmost/leftmost per level", "Word Ladder (levels = steps)"],
      name: "BFS: Level Order",
      signals: ["Level by level", "Right/left side view", "Shortest distance in an unweighted tree/graph"],
      approach: "Use a queue. Snapshot the queue length at the start of each level and process exactly that many nodes, collecting what you need per level.",
      template: `q = deque([root])
while q:
    for _ in range(len(q)):
        node = q.popleft()
        ...
        q.extend(children)`,
      variations: ["Take the last node of each level (right view)", "Alternate direction for zigzag"],
      pitfalls: ["Reading len(q) inside the loop condition instead of once"],
      problems: [
        P("binary-tree-level-order-traversal", "Binary Tree Level Order Traversal", "Medium", "Process the queue one level at a time."),
        P("binary-tree-right-side-view", "Binary Tree Right Side View", "Medium", "Last node of each level."),
        P("binary-tree-zigzag-level-order-traversal", "Binary Tree Zigzag Level Order Traversal", "Medium", "Reverse alternate levels."),
      ],
    },
    {
      id: "construct-serialize",
      subtopic: "Construction & graph views",
      transfer: ["Build tree from inorder + postorder", "Serialize N-ary trees and BSTs (compact form)", "Verify preorder serialization"],
      name: "Construct & Serialize",
      signals: ["Rebuild a tree from traversals", "Encode/decode a tree"],
      approach: "Preorder gives roots; inorder tells the left/right split. Use a value→index map for the inorder split and consume the preorder with an index. For serialization, preorder with null markers is self-delimiting.",
      variations: ["Inorder + postorder: consume postorder from the right", "BFS serialization"],
      pitfalls: ["Build the left subtree before the right when consuming preorder"],
      problems: [
        P("construct-binary-tree-from-preorder-and-inorder-traversal", "Construct Binary Tree from Preorder and Inorder Traversal", "Medium", "Preorder picks root; inorder splits sides."),
        P("serialize-and-deserialize-binary-tree", "Serialize and Deserialize Binary Tree", "Hard", "Preorder with null markers."),
      ],
    },
  ],
};

export const heap: Topic = {
  id: "heap",
  name: "Heap / Priority Queue",
  blurb: "Always-available min or max in O(log n). Reach for it when 'the best remaining' changes over time.",
  patterns: [
    {
      id: "top-k",
      transfer: ["Top K frequent words/elements", "K closest points, K largest in a stream", "Kth largest in a matrix / sorted structure"],
      name: "Top-K / K-th Element",
      signals: ["K largest / smallest / most frequent / closest", "n large, k small", "Don't need a full sort"],
      approach:
        "Keep a heap of size k. For the k largest, use a *min*-heap: push each item and pop the smallest when size exceeds k. The heap root is the k-th largest. O(n log k).",
      template: `h = []
for x in a:
    heappush(h, x)
    if len(h) > k: heappop(h)
return h[0]`,
      variations: ["Quickselect for average O(n)", "Heap of (key, item) tuples", "Max-heap in Python via negation"],
      pitfalls: ["Min-heap for k largest, max-heap for k smallest — easy to invert"],
      problems: [
        P("kth-largest-element-in-an-array", "Kth Largest Element in an Array", "Medium", "Min-heap of size k."),
        P("k-closest-points-to-origin", "K Closest Points to Origin", "Medium", "Max-heap of size k on distance."),
        P("top-k-frequent-words", "Top K Frequent Words", "Medium", "Heap ordering with a tie-break on the word."),
      ],
    },
    {
      id: "two-heaps",
      transfer: ["Sliding window median", "IPO / maximize capital (two heaps by role)", "Balancing two halves of a stream"],
      name: "Two Heaps (Median)",
      signals: ["Running median", "Split data into 'lower half' and 'upper half'"],
      approach:
        "Max-heap for the lower half, min-heap for the upper half. Rebalance so sizes differ by at most 1. The median is the top of the larger heap or the average of both tops.",
      variations: ["Sliding-window median with lazy deletion"],
      pitfalls: ["Push through the opposite heap first to keep the ordering invariant"],
      problems: [P("find-median-from-data-stream", "Find Median from Data Stream", "Hard", "Balanced max-heap / min-heap pair.")],
    },
    {
      id: "k-way-merge",
      transfer: ["Merge k sorted arrays/lists", "Smallest range covering elements from k lists", "Kth smallest in sorted matrix", "Ugly Number II / super ugly numbers"],
      name: "K-Way Merge / Frontier Expansion",
      signals: ["Merge k sorted lists", "Smallest pairs / k-th smallest in sorted structures"],
      approach: "Seed the heap with the first candidate from each source. Pop the smallest, then push its successor. Each pop yields the next element of the global order.",
      variations: ["Matrix rows as sorted lists", "Pair sums (i, j) → push (i, j+1)"],
      pitfalls: ["Avoid pushing the same (i, j) twice — use a visited set or a fixed expansion rule"],
      problems: [
        P("merge-k-sorted-lists", "Merge k Sorted Lists", "Hard", "Heap holds one node per list."),
        P("find-k-pairs-with-smallest-sums", "Find K Pairs with Smallest Sums", "Medium", "Expand the frontier from (0,0)."),
      ],
    },
    {
      id: "greedy-scheduling",
      transfer: ["Task scheduling with cooldown", "Meeting rooms with a min-heap of end times", "Furthest building you can reach", "Rearrange characters k distance apart"],
      name: "Greedy with a Heap (Scheduling)",
      signals: ["Always take the most/least frequent or the earliest deadline", "Rearrange so no two equal items are adjacent", "Repeatedly smash/combine the largest items"],
      approach: "At each step, take the greedy-best item from the heap, use it, and push back whatever remains (possibly after a cooldown).",
      variations: ["Cooldown queue to hold items until available again"],
      pitfalls: ["Re-inserting an item before its cooldown ends"],
      problems: [
        P("last-stone-weight", "Last Stone Weight", "Easy", "Pop two largest, push the difference."),
        P("reorganize-string", "Reorganize String", "Medium", "Always place the most frequent char that isn't the last."),
        P("task-scheduler", "Task Scheduler", "Medium", "Max-heap of counts plus a cooldown queue."),
      ],
    },
  ],
};

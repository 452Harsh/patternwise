import { lessons1 } from "./lessons-1";
import { lessons2 } from "./lessons-2";
import { lessons3 } from "./lessons-3";
import type { PyLesson } from "./types";

export * from "./types";

/** Ordered by how often they come up in interviews. */
export const pyLessons: PyLesson[] = [...lessons1, ...lessons2, ...lessons3];

export const getPyLesson = (id: string) => pyLessons.find((l) => l.id === id);

/** Quick "which structure do I reach for?" table on the roadmap. */
export const pyChooser: { need: string; py: string; cpp: string }[] = [
  { need: "Indexed sequence, append at end", py: "list", cpp: "vector" },
  { need: "Key → value, fast lookup", py: "dict", cpp: "unordered_map" },
  { need: "Count occurrences", py: "Counter", cpp: "unordered_map<T, int>" },
  { need: "Key → list of values", py: "defaultdict(list)", cpp: "unordered_map<K, vector<V>>" },
  { need: "Seen before? / uniqueness", py: "set", cpp: "unordered_set" },
  { need: "Pair / hashable composite key", py: "tuple", cpp: "pair / tuple" },
  { need: "LIFO", py: "list (append / pop)", cpp: "stack" },
  { need: "FIFO / both ends", py: "deque", cpp: "queue / deque" },
  { need: "Repeated min / max", py: "heapq (negate for max)", cpp: "priority_queue" },
  { need: "Sorted + lower_bound", py: "sorted list + bisect", cpp: "lower_bound / upper_bound" },
  { need: "Ordered set / map with updates", py: "sortedcontainers.SortedList", cpp: "set / map / multiset" },
];

import {
  ArrowLeftRight,
  Binary,
  Blocks,
  Boxes,
  Brackets,
  Calculator,
  Combine,
  Grid3x3,
  Hash,
  Layers,
  Link2,
  ListOrdered,
  Network,
  Orbit,
  Route,
  ScanLine,
  Search,
  Sigma,
  SortAsc,
  Spline,
  Split,
  TextCursorInput,
  TrendingUp,
  TreeDeciduous,
  TreePine,
  Waypoints,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "arrays-hashing": Hash,
  strings: TextCursorInput,
  "prefix-sum": Sigma,
  matrix: Grid3x3,
  "two-pointers": ArrowLeftRight,
  "sliding-window": ScanLine,
  sorting: SortAsc,
  "binary-search": Search,
  "linked-list": Link2,
  "stack-queue": Layers,
  monotonic: TrendingUp,
  backtracking: Split,
  trees: TreeDeciduous,
  bst: TreePine,
  heap: ListOrdered,
  graphs: Network,
  "topological-sort": Workflow,
  "union-find": Combine,
  "shortest-path": Route,
  "advanced-graphs": Waypoints,
  greedy: Orbit,
  intervals: Spline,
  dp: Blocks,
  tries: Brackets,
  "bit-manipulation": Binary,
  math: Calculator,
  "advanced-ds": Boxes,
};

export function TopicIcon({ id, className }: { id: string; className?: string }) {
  const Icon = ICONS[id] ?? Hash;
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15", className)}>
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

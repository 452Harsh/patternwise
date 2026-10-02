"use client";

import { toast } from "sonner";
import { CircleCheck, CircleDashed, GraduationCap, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Pattern } from "@/data/types";
import { blankPattern, updatePattern, usePatternProgress, type PatternStatus } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const PATTERN_STATUS: { value: PatternStatus; label: string; icon: LucideIcon; active: string }[] = [
  { value: "unrated", label: "Not started", icon: CircleDashed, active: "bg-muted text-foreground" },
  { value: "learning", label: "Learning", icon: GraduationCap, active: "bg-info/15 text-info" },
  { value: "needs-practice", label: "Needs practice", icon: TriangleAlert, active: "bg-warning/15 text-warning" },
  { value: "understood", label: "Understood", icon: CircleCheck, active: "bg-success/15 text-success" },
];

export function PatternStatusControl({ pattern }: { pattern: Pattern }) {
  const entry = usePatternProgress()[pattern.id] ?? blankPattern();
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border bg-surface p-1" role="radiogroup" aria-label={`Your status for ${pattern.name}`}>
      {PATTERN_STATUS.map((s) => {
        const Icon = s.icon;
        const active = entry.status === s.value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              updatePattern(pattern.id, { status: s.value }, pattern.name);
              if (s.value === "understood") toast.success(`${pattern.name} marked as understood`);
            }}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active ? s.active : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

export function PatternStatusLabel({ status }: { status: PatternStatus }) {
  const s = PATTERN_STATUS.find((x) => x.value === status)!;
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", status === "unrated" ? "text-muted-foreground" : s.active.split(" ").find((c) => c.startsWith("text-")))}>
      <Icon className="size-3" aria-hidden />
      {s.label}
    </span>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Hand, Sparkles } from "lucide-react";
import { analyzeDSA } from "@/lib/coach/dsa";
import { interviewDaysLeft, prefsOf } from "@/lib/coach/plan";
import { analyzeSD } from "@/lib/coach/sd";
import { DSA_ACTION_LABEL, SD_ACTION_LABEL, type CoachCtx } from "@/lib/coach/types";
import { today, useStore } from "@/lib/progress";

/** Dashboard entry point to the AI Coach: today's top pick for this module, computed locally. */
export function CoachPick({ ctx }: { ctx: CoachCtx }) {
  const state = useStore();
  const pick = useMemo(() => {
    const date = today();
    const prefs = prefsOf(state);
    const left = interviewDaysLeft(prefs, date);
    if (ctx === "dsa") {
      const f = analyzeDSA(state, date, prefs, left).focus;
      return f && { title: f.patternName, action: DSA_ACTION_LABEL[f.action], reason: f.reasons[0], stop: f.stopSolving };
    }
    const f = analyzeSD(state, date, left).focus;
    return f && { title: f.title, action: SD_ACTION_LABEL[f.action], reason: f.reasons[0], stop: f.stopSolving };
  }, [state, ctx]);

  if (!pick) return null;
  return (
    <Link
      href={`/coach?ctx=${ctx}`}
      className="group flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
        <Sparkles className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-primary">Coach&apos;s pick for today</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
          <span className="font-semibold">{pick.title}</span>
          <span className="text-muted-foreground">· {pick.action}</span>
          {pick.stop && (
            <span className="inline-flex items-center gap-1 text-xs text-warning">
              <Hand className="size-3" aria-hidden /> review before solving more
            </span>
          )}
        </span>
        {pick.reason && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{pick.reason}</span>}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
        Open today&apos;s plan <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

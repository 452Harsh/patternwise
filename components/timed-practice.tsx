"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, Play, Shuffle, Square, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DifficultyBadge, Panel, Tag } from "@/components/kit";
import { LogAttemptDialog } from "@/components/log-attempt-dialog";
import { NativeSelect } from "@/components/native-select";
import { IMPORTANT_SET } from "@/data/important";
import { useCatalog, type CatalogItem } from "@/lib/catalog";
import { duration } from "@/lib/format";
import { isSolved, needsRevisit, useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

const LIMITS = { Easy: 20, Medium: 35, Hard: 50 } as const;

/** Pick a random problem, start a clock with a difficulty-based target, then log the attempt with its time. */
export function TimedPractice() {
  const catalog = useCatalog();
  const progress = useProgress();
  const [pool, setPool] = useState("essentials");
  const [difficulty, setDifficulty] = useState("Medium");
  const [pick, setPick] = useState<CatalogItem | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const candidates = catalog.filter(({ problem }) => {
    const e = progress[problem.slug];
    if (difficulty !== "any" && problem.difficulty !== difficulty) return false;
    if (pool === "essentials") return IMPORTANT_SET.has(problem.slug);
    if (pool === "unsolved") return !isSolved(e);
    if (pool === "revision") return needsRevisit(e);
    return true;
  });

  const shuffle = () => {
    if (!candidates.length) return;
    setPick(candidates[Math.floor(Math.random() * candidates.length)]);
    setStartedAt(null);
  };

  const running = startedAt !== null;
  const secs = running ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;
  const limit = pick ? LIMITS[pick.problem.difficulty] * 60 : 0;
  const over = running && secs > limit;

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect aria-label="Problem pool" value={pool} onChange={(e) => setPool(e.target.value)} disabled={running}>
          <option value="essentials">Interview essentials</option>
          <option value="unsolved">Any unsolved</option>
          <option value="revision">Due or previously failed</option>
          <option value="all">Everything</option>
        </NativeSelect>
        <NativeSelect aria-label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={running}>
          <option value="any">Any difficulty</option>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </NativeSelect>
        <Button variant="secondary" onClick={shuffle} disabled={running || !candidates.length}>
          <Shuffle data-icon="inline-start" /> {pick ? "Another" : "Pick a problem"}
        </Button>
        <span className="text-xs text-muted-foreground">{candidates.length} candidates</span>
      </div>

      {pick ? (
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/problems/${pick.problem.slug}`} className="truncate text-lg font-semibold hover:text-primary">
                {pick.problem.title}
              </Link>
              <DifficultyBadge difficulty={pick.problem.difficulty} />
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {/* Pattern is hidden while timing: recognising it is part of the drill. */}
              {running ? <Tag>Pattern hidden</Tag> : <Tag>{pick.pattern.name}</Tag>}
              <Tag mono>target {LIMITS[pick.problem.difficulty]} min</Tag>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn("inline-flex items-center gap-1.5 font-mono text-2xl font-semibold tabular-nums", over ? "text-destructive" : running ? "text-primary" : "text-muted-foreground")}
              aria-live="off"
            >
              <Timer className="size-5" aria-hidden /> {running ? duration(secs) || "0s" : "0:00"}
            </span>
            {running ? (
              <Button
                onClick={() => {
                  setElapsed(secs);
                  setStartedAt(null);
                  setLogOpen(true);
                }}
              >
                <Square data-icon="inline-start" /> Finish & log
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setStartedAt(Date.now());
                  setNow(Date.now());
                  if (pick.url) window.open(pick.url, "_blank", "noopener,noreferrer");
                }}
              >
                <Play data-icon="inline-start" /> Start <ExternalLink data-icon="inline-end" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Simulate interview conditions: a random problem, a clock, and the pattern hidden until you finish.
        </p>
      )}

      {pick && (
        <LogAttemptDialog slug={pick.problem.slug} title={pick.problem.title} open={logOpen} onOpenChange={setLogOpen} durationSec={elapsed} />
      )}
    </Panel>
  );
}

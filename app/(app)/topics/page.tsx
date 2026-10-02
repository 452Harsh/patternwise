"use client";

import Link from "next/link";
import { useState } from "react";
import { TriangleAlert, CircleCheck } from "lucide-react";
import { Meter, PageHeader, Panel, Shimmer, masteryTone, pct } from "@/components/kit";
import { TopicIcon } from "@/components/topic-icon";
import { getTopic } from "@/data/curriculum";
import { PHASES } from "@/data/study-plan";
import { useHydrated, useProgress } from "@/lib/progress";
import { countSolved, topicStat } from "@/lib/stats";
import { cn } from "@/lib/utils";

export default function TopicsPage() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const [phase, setPhase] = useState("all");

  const phases = PHASES.filter((p) => p.topicIds.length);
  const shown = phases.filter((p) => phase === "all" || p.id === phase);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Topics"
        subtitle="Every area of DSA preparation, grouped into study phases."
      />

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by phase">
        {[{ id: "all", name: "All topics" }, ...phases].map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={phase === p.id}
            onClick={() => setPhase(p.id)}
            className={cn(
              "h-8 rounded-lg border px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              phase === p.id ? "border-primary/40 bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {p.id !== "all" && <span className="mr-1.5 font-mono text-xs text-muted-foreground">{i}</span>}
            {p.name}
          </button>
        ))}
      </div>

      {shown.map((p) => (
        <section key={p.id} aria-labelledby={`ph-${p.id}`}>
          <div className="mb-3 flex items-baseline gap-3">
            <h2 id={`ph-${p.id}`} className="text-base font-semibold">
              {p.name}
            </h2>
            <span className="text-xs text-muted-foreground">{p.summary}</span>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {p.topicIds.map((id) => {
              const topic = getTopic(id)!;
              const s = topicStat(topic, progress);
              const covered = topic.patterns.filter((pt) => countSolved(pt.problems, progress).solved > 0).length;
              const completion = s.total ? s.solved / s.total : 0;
              return (
                <li key={id}>
                  <Link href={`/topics/${id}`} className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Panel interactive className="flex h-full flex-col p-4">
                      <div className="flex items-start gap-3">
                        <TopicIcon id={id} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{topic.name}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{topic.blurb}</p>
                        </div>
                        {hydrated ? (
                          <span className="font-mono text-lg font-semibold tabular-nums">{pct(completion)}</span>
                        ) : (
                          <Shimmer className="h-6 w-10" />
                        )}
                      </div>
                      <div className="mt-4">
                        <Meter value={hydrated ? completion : 0} tone={masteryTone(s.mastery)} label={`${topic.name} completion`} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          <span className="font-mono text-foreground">{hydrated ? s.solved : 0}</span>/{s.total} solved ·{" "}
                          <span className="font-mono text-foreground">{hydrated ? covered : 0}</span>/{topic.patterns.length} patterns
                        </span>
                        {hydrated && s.weak ? (
                          <span className="inline-flex items-center gap-1 text-warning">
                            <TriangleAlert className="size-3.5" aria-hidden /> Needs work
                          </span>
                        ) : hydrated && s.completed ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CircleCheck className="size-3.5" aria-hidden /> Completed
                          </span>
                        ) : null}
                      </div>
                    </Panel>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

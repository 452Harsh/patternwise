"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { LayoutGrid, Plus, Rows3, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddProblemDialog } from "@/components/add-problem-dialog";
import { EmptyState, PageHeader } from "@/components/kit";
import { NativeSelect } from "@/components/native-select";
import { ProblemList, type ListView } from "@/components/problem-list";
import { topics } from "@/data/curriculum";
import { IMPORTANT_SET } from "@/data/important";
import { useCatalog } from "@/lib/catalog";
import { displayStatus, isDue, useProgress, type DisplayStatus } from "@/lib/progress";
import { cn } from "@/lib/utils";

type Sort = "curriculum" | "title" | "difficulty" | "last" | "next" | "attempts";
type Revision = "all" | "due" | "scheduled" | "flagged" | "failed" | "never";
const DIFF_RANK = { Easy: 0, Medium: 1, Hard: 2 };

function ProblemsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const catalog = useCatalog();
  const progress = useProgress();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [difficulty, setDifficulty] = useState(params.get("difficulty") ?? "all");
  const [topic, setTopic] = useState(params.get("topic") ?? "all");
  const [pattern, setPattern] = useState("all");
  const [status, setStatus] = useState<"all" | DisplayStatus>((params.get("status") as DisplayStatus) ?? "all");
  const [revision, setRevision] = useState<Revision>((params.get("revision") as Revision) ?? "all");
  const [only, setOnly] = useState(params.get("only") ?? "all");
  const [sort, setSort] = useState<Sort>("curriculum");
  const [view, setView] = useState<ListView>("table");
  const [adding, setAdding] = useState(params.get("add") === "1");

  const patternOptions = topic === "all" ? [] : (topics.find((t) => t.id === topic)?.patterns ?? []);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = catalog.filter(({ problem, topic: t, pattern: p }) => {
      const e = progress[problem.slug];
      if (needle && !`${problem.title} ${p.name} ${t.name} ${problem.takeaway}`.toLowerCase().includes(needle)) return false;
      if (difficulty !== "all" && problem.difficulty !== difficulty) return false;
      if (topic !== "all" && t.id !== topic) return false;
      if (pattern !== "all" && p.id !== pattern) return false;
      if (status !== "all" && displayStatus(e) !== status) return false;
      if (revision === "due" && !isDue(e)) return false;
      if (revision === "scheduled" && !e?.nextReview) return false;
      if (revision === "flagged" && !e?.revisit) return false;
      if (revision === "failed" && !e?.failCount) return false;
      if (revision === "never" && !(e && e.solveCount > 0 && e.revisitCount === 0)) return false;
      if (only === "essentials" && !IMPORTANT_SET.has(problem.slug)) return false;
      if (only === "favourites" && !e?.starred) return false;
      if (only === "custom" && !problem.slug.startsWith("custom-")) return false;
      return true;
    });
    const key = (slug: string) => progress[slug];
    const cmp: Record<Sort, ((a: (typeof out)[number], b: (typeof out)[number]) => number) | null> = {
      curriculum: null,
      title: (a, b) => a.problem.title.localeCompare(b.problem.title),
      difficulty: (a, b) => DIFF_RANK[a.problem.difficulty] - DIFF_RANK[b.problem.difficulty],
      last: (a, b) => (key(b.problem.slug)?.lastAttemptAt ?? "").localeCompare(key(a.problem.slug)?.lastAttemptAt ?? ""),
      next: (a, b) => (key(a.problem.slug)?.nextReview ?? "9999").localeCompare(key(b.problem.slug)?.nextReview ?? "9999"),
      attempts: (a, b) => (key(b.problem.slug)?.history.length ?? 0) - (key(a.problem.slug)?.history.length ?? 0),
    };
    const fn = cmp[sort];
    return fn ? [...out].sort(fn) : out;
  }, [catalog, progress, q, difficulty, topic, pattern, status, revision, only, sort]);

  const filtered = q || difficulty !== "all" || topic !== "all" || status !== "all" || revision !== "all" || only !== "all";
  const clear = () => {
    setQ("");
    setDifficulty("all");
    setTopic("all");
    setPattern("all");
    setStatus("all");
    setRevision("all");
    setOnly("all");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Problems"
        subtitle="Build pattern recognition, one problem at a time."
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus data-icon="inline-start" /> Add problem
          </Button>
        }
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, pattern, idea…"
            aria-label="Search problems"
            className="w-full sm:w-72"
          />
          <NativeSelect aria-label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="all">All difficulties</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </NativeSelect>
          <NativeSelect
            aria-label="Topic"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setPattern("all");
            }}
          >
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} disabled={topic === "all"}>
            <option value="all">{topic === "all" ? "Pick a topic for patterns" : "All patterns"}</option>
            {patternOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">Any status</option>
            <option value="not-started">Not started</option>
            <option value="attempted">Attempted</option>
            <option value="solved">Solved</option>
            <option value="needs-revision">Needs revision</option>
            <option value="mastered">Mastered</option>
          </NativeSelect>
          <NativeSelect aria-label="Revision" value={revision} onChange={(e) => setRevision(e.target.value as Revision)}>
            <option value="all">Any revision state</option>
            <option value="due">Due now</option>
            <option value="scheduled">Scheduled</option>
            <option value="never">Solved, never revised</option>
            <option value="flagged">Flagged for revision</option>
            <option value="failed">Previously failed</option>
          </NativeSelect>
          <NativeSelect aria-label="List" value={only} onChange={(e) => setOnly(e.target.value)}>
            <option value="all">All lists</option>
            <option value="essentials">Interview essentials</option>
            <option value="favourites">Favourites</option>
            <option value="custom">My added problems</option>
          </NativeSelect>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            <span className="font-mono text-foreground">{rows.length}</span> problem{rows.length === 1 ? "" : "s"}
            {filtered && (
              <button type="button" onClick={clear} className="ml-3 text-xs underline underline-offset-2 hover:text-foreground">
                Clear filters
              </button>
            )}
          </p>
          <div className="flex items-center gap-2">
            <NativeSelect aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="curriculum">Sort: study order</option>
              <option value="title">Sort: title</option>
              <option value="difficulty">Sort: difficulty</option>
              <option value="last">Sort: recently attempted</option>
              <option value="next">Sort: next revision</option>
              <option value="attempts">Sort: most attempts</option>
            </NativeSelect>
            <div className="flex rounded-lg border p-0.5" role="group" aria-label="View">
              {(
                [
                  ["table", Rows3, "Table view"],
                  ["cards", LayoutGrid, "Card view"],
                ] as const
              ).map(([v, Icon, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  aria-label={label}
                  className={cn(
                    "grid size-7 place-items-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    view === v ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ProblemList
        items={rows}
        view={view}
        empty={
          <EmptyState
            icon={SearchX}
            title="No problems match"
            description="Try removing a filter, or add the problem yourself."
            action={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clear}>
                  Clear filters
                </Button>
                <Button size="sm" onClick={() => setAdding(true)}>
                  Add problem
                </Button>
              </div>
            }
          />
        }
      />

      <AddProblemDialog
        open={adding}
        onOpenChange={(o) => {
          setAdding(o);
          if (!o && params.get("add")) router.replace("/problems");
        }}
      />
    </div>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense>
      <ProblemsInner />
    </Suspense>
  );
}

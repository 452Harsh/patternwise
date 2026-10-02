"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Code2, Library, NotebookPen, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DifficultyBadge, EmptyState, PageHeader, Panel, Shimmer, Tag } from "@/components/kit";
import { patternIndex } from "@/data/curriculum";
import { useCatalog } from "@/lib/catalog";
import { timeAgo } from "@/lib/format";
import { useHydrated, useStore } from "@/lib/progress";
import { cn } from "@/lib/utils";

type Kind = "all" | "notes" | "mistakes" | "code" | "patterns";

const FIELDS = [
  ["statement", "In my words"],
  ["approach", "Approach"],
  ["insight", "Key insight"],
  ["notes", "Notes"],
  ["mistakes", "Mistakes"],
] as const;

export default function NotesPage() {
  const state = useStore();
  const hydrated = useHydrated();
  const catalog = useCatalog();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>("all");

  const problemNotes = useMemo(
    () =>
      catalog
        .map((item) => ({ item, e: state.problems[item.problem.slug] }))
        .filter(({ e }) => e && (FIELDS.some(([f]) => e[f].trim()) || e.code.trim()))
        .sort((a, b) => b.e.updatedAt.localeCompare(a.e.updatedAt)),
    [catalog, state.problems],
  );
  const patternNotes = Object.entries(state.patterns)
    .filter(([id, p]) => p.note.trim() && patternIndex.has(id))
    .map(([id, p]) => ({ ...patternIndex.get(id)!, note: p.note }));

  const needle = q.trim().toLowerCase();
  const filteredProblems = problemNotes.filter(({ item, e }) => {
    if (kind === "patterns") return false;
    if (kind === "mistakes" && !e.mistakes.trim()) return false;
    if (kind === "code" && !e.code.trim()) return false;
    if (kind === "notes" && !FIELDS.some(([f]) => f !== "mistakes" && e[f].trim())) return false;
    if (!needle) return true;
    return `${item.problem.title} ${item.pattern.name} ${FIELDS.map(([f]) => e[f]).join(" ")} ${e.code}`.toLowerCase().includes(needle);
  });
  const filteredPatterns = patternNotes.filter(
    (p) => (kind === "all" || kind === "patterns") && (!needle || `${p.pattern.name} ${p.note}`.toLowerCase().includes(needle)),
  );

  const counts: Record<Kind, number> = {
    all: problemNotes.length + patternNotes.length,
    notes: problemNotes.filter(({ e }) => FIELDS.some(([f]) => f !== "mistakes" && e[f].trim())).length,
    mistakes: problemNotes.filter(({ e }) => e.mistakes.trim()).length,
    code: problemNotes.filter(({ e }) => e.code.trim()).length,
    patterns: patternNotes.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Notes" subtitle="Everything you've written: approaches, insights, mistakes, solutions and pattern notes." />

      <div className="flex flex-wrap items-center gap-2">
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your notes…" aria-label="Search notes" className="w-full sm:w-72" />
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Note type">
          {(
            [
              ["all", "All"],
              ["notes", "Notes"],
              ["mistakes", "Mistakes"],
              ["code", "Solutions"],
              ["patterns", "Patterns"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                "h-8 rounded-lg border px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                kind === k ? "border-primary/40 bg-primary/10" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {label} <span className="ml-1 font-mono text-xs text-muted-foreground">{hydrated ? counts[k] : "·"}</span>
            </button>
          ))}
        </div>
      </div>

      {!hydrated ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Shimmer key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : counts.all === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No notes yet"
          description="Open any problem and write how you recognised the pattern. Those notes are what you'll revise from."
          action={
            <Link href="/problems" className="text-sm font-medium text-primary hover:underline">
              Pick a problem →
            </Link>
          }
        />
      ) : filteredProblems.length + filteredPatterns.length === 0 ? (
        <EmptyState icon={NotebookPen} title="Nothing matches" description="Try another search or note type." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredPatterns.map(({ pattern, topic, note }) => (
            <li key={pattern.id}>
              <Link href={`/patterns/${pattern.id}`} className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Panel interactive className="h-full p-4">
                  <div className="flex items-center gap-2">
                    <Library className="size-4 text-primary" aria-hidden />
                    <span className="font-medium">{pattern.name}</span>
                    <Tag>{topic.name}</Tag>
                  </div>
                  <p className="mt-2 line-clamp-4 text-sm whitespace-pre-line text-muted-foreground">{note}</p>
                </Panel>
              </Link>
            </li>
          ))}
          {filteredProblems.map(({ item, e }) => (
            <li key={item.problem.slug}>
              <Link href={`/problems/${item.problem.slug}`} className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Panel interactive className="h-full space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{item.problem.title}</span>
                    <DifficultyBadge difficulty={item.problem.difficulty} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag>{item.pattern.name}</Tag>
                    {e.code.trim() && (
                      <Tag className="gap-1">
                        <Code2 className="size-3" aria-hidden /> solution
                      </Tag>
                    )}
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">{timeAgo(e.updatedAt)}</span>
                  </div>
                  {FIELDS.filter(([f]) => e[f].trim()).slice(0, 2).map(([f, label]) => (
                    <p key={f} className="line-clamp-2 text-sm">
                      <span className={cn("mr-1.5 font-mono text-[10px] uppercase tracking-wider", f === "mistakes" ? "text-warning" : "text-muted-foreground")}>
                        {f === "mistakes" && <TriangleAlert className="mr-0.5 inline size-3" aria-hidden />}
                        {label}
                      </span>
                      <span className="text-muted-foreground">{e[f]}</span>
                    </p>
                  ))}
                </Panel>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

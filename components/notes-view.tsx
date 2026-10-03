"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Code2, Library, Network, NotebookPen, TriangleAlert, Workflow } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DifficultyBadge, EmptyState, PageHeader, Panel, Shimmer, Tag } from "@/components/kit";
import { TrackTag } from "@/components/sd/sd-kit";
import { patternIndex } from "@/data/curriculum";
import { useCatalog } from "@/lib/catalog";
import { timeAgo } from "@/lib/format";
import { useHydrated, useStore } from "@/lib/progress";
import { useSDItems } from "@/lib/sd";
import { cn } from "@/lib/utils";

export type NotesScope = "dsa" | "sd";
type Kind = "all" | "notes" | "mistakes" | "code" | "patterns";

const FIELDS = [
  ["statement", "In my words"],
  ["approach", "Approach"],
  ["insight", "Key insight"],
  ["notes", "Notes"],
  ["mistakes", "Mistakes"],
] as const;

const KINDS: Record<NotesScope, [Kind, string][]> = {
  dsa: [
    ["all", "All"],
    ["notes", "Notes"],
    ["mistakes", "Mistakes"],
    ["code", "Solutions"],
    ["patterns", "Patterns"],
  ],
  sd: [
    ["all", "All"],
    ["notes", "Concepts & problems"],
    ["patterns", "Patterns"],
    ["code", "Diagrams"],
  ],
};

function KindTabs({ scope, kind, setKind, counts, hydrated }: { scope: NotesScope; kind: Kind; setKind: (k: Kind) => void; counts: Partial<Record<Kind, number>>; hydrated: boolean }) {
  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label="Note type">
      {KINDS[scope].map(([k, label]) => (
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
          {label} <span className="ml-1 font-mono text-xs text-muted-foreground">{hydrated ? (counts[k] ?? 0) : "·"}</span>
        </button>
      ))}
    </div>
  );
}

/** Notes for one module only: DSA (problems, patterns) or System Design (concepts, patterns, problems, diagrams). */
export function NotesView({ scope }: { scope: NotesScope }) {
  const hydrated = useHydrated();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const needle = q.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={scope === "dsa" ? "DSA" : "System Design"}
        title="Notes"
        subtitle={
          scope === "dsa"
            ? "Everything you've written for DSA: approaches, insights, mistakes, solutions and pattern notes."
            : "Everything you've written for System Design: concept, pattern and problem notes, plus diagram annotations."
        }
      />
      {scope === "dsa" ? (
        <DSANotes q={q} setQ={setQ} needle={needle} kind={kind} setKind={setKind} hydrated={hydrated} />
      ) : (
        <SDNotesList q={q} setQ={setQ} needle={needle} kind={kind} setKind={setKind} hydrated={hydrated} />
      )}
    </div>
  );
}

interface ListProps {
  q: string;
  setQ: (v: string) => void;
  needle: string;
  kind: Kind;
  setKind: (k: Kind) => void;
  hydrated: boolean;
}

function Toolbar({ scope, q, setQ, kind, setKind, counts, hydrated }: ListProps & { scope: NotesScope; counts: Partial<Record<Kind, number>> }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your notes…" aria-label="Search notes" className="w-full sm:w-72" />
      <KindTabs scope={scope} kind={kind} setKind={setKind} counts={counts} hydrated={hydrated} />
    </div>
  );
}

const Loading = () => (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
    {Array.from({ length: 4 }, (_, i) => (
      <Shimmer key={i} className="h-36 rounded-xl" />
    ))}
  </div>
);

function DSANotes(props: ListProps) {
  const { needle, kind, hydrated } = props;
  const state = useStore();
  const catalog = useCatalog();

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
    <>
      <Toolbar {...props} scope="dsa" counts={counts} />
      {!hydrated ? (
        <Loading />
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
                  {FIELDS.filter(([f]) => e[f].trim())
                    .slice(0, 2)
                    .map(([f, label]) => (
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
    </>
  );
}

function SDNotesList(props: ListProps) {
  const { needle, kind, hydrated } = props;
  const state = useStore();
  const sdItems = useSDItems();

  // Item notes, diagram notes and per-component notes on diagrams.
  const notes = useMemo(
    () =>
      sdItems
        .map((item) => {
          const e = state.sd[item.key];
          const d = item.kind === "diagram" ? state.diagrams[item.id] : undefined;
          const parts = [
            e?.notes.trim(),
            d?.notes.trim(),
            ...(d?.nodes.filter((n) => n.note?.trim()).map((n) => `${n.label}: ${n.note!.trim()}`) ?? []),
          ].filter(Boolean) as string[];
          return { item, text: parts.join("\n"), updatedAt: d?.updatedAt ?? e?.updatedAt ?? "" };
        })
        .filter((x) => x.text)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [sdItems, state.sd, state.diagrams],
  );

  const matchesKind = (x: (typeof notes)[number], k: Kind) =>
    k === "all" ||
    (k === "patterns" && x.item.kind === "pattern") ||
    (k === "code" && x.item.kind === "diagram") ||
    (k === "notes" && (x.item.kind === "concept" || x.item.kind === "problem"));
  const filtered = notes.filter((x) => matchesKind(x, kind) && (!needle || `${x.item.title} ${x.text}`.toLowerCase().includes(needle)));
  const counts: Partial<Record<Kind, number>> = Object.fromEntries((["all", "notes", "patterns", "code"] as Kind[]).map((k) => [k, notes.filter((x) => matchesKind(x, k)).length]));

  return (
    <>
      <Toolbar {...props} scope="sd" counts={counts} />
      {!hydrated ? (
        <Loading />
      ) : notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No notes yet"
          description="Write your own explanation on any concept, pattern or design problem — or annotate a diagram."
          action={
            <Link href="/system-design/concepts" className="text-sm font-medium text-primary hover:underline">
              Browse concepts →
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={NotebookPen} title="Nothing matches" description="Try another search or note type." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map(({ item, text, updatedAt }) => (
            <li key={item.key}>
              <Link href={item.href} className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Panel interactive className="h-full space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    {item.kind === "diagram" ? <Workflow className="size-4 shrink-0 text-primary" aria-hidden /> : <Network className="size-4 shrink-0 text-primary" aria-hidden />}
                    <span className="truncate font-medium">{item.title}</span>
                    <TrackTag track={item.track} />
                    <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">{updatedAt ? timeAgo(updatedAt) : ""}</span>
                  </div>
                  <Tag>{item.group}</Tag>
                  <p className="line-clamp-4 text-sm whitespace-pre-line text-muted-foreground">{text}</p>
                </Panel>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

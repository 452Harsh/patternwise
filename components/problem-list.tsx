"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { DifficultyBadge, Panel, Shimmer, StatusBadge, Tag } from "@/components/kit";
import type { CatalogItem } from "@/lib/catalog";
import { relativeDay } from "@/lib/format";
import { displayStatus, isDue, updateEntry, useHydrated, useProgress, type Entry } from "@/lib/progress";
import { cn } from "@/lib/utils";

export type ListView = "table" | "cards";

const lastSolved = (e?: Entry) => {
  const last = e?.history.filter((h) => h.result !== "failed").at(-1);
  return last?.date ?? e?.solvedAt;
};

function StarButton({ slug, title, starred }: { slug: string; title: string; starred: boolean }) {
  return (
    <button
      type="button"
      onClick={(ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        updateEntry(slug, { starred: !starred }, title);
      }}
      aria-pressed={starred}
      aria-label={starred ? `Unfavourite ${title}` : `Favourite ${title}`}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        starred ? "text-warning" : "text-muted-foreground/40 hover:text-muted-foreground",
      )}
    >
      <Star className={cn("size-4", starred && "fill-current animate-pop")} aria-hidden />
    </button>
  );
}

function NextReview({ e }: { e?: Entry }) {
  if (!e?.revisit || !e.nextReview) return <span className="text-muted-foreground">—</span>;
  const due = isDue(e);
  return <span className={cn(due && "font-medium text-warning")}>{due ? "Due" : relativeDay(e.nextReview)}</span>;
}

export function ProblemList({
  items,
  view = "table",
  hideTopic,
  hidePattern,
  empty,
}: {
  items: CatalogItem[];
  view?: ListView;
  hideTopic?: boolean;
  hidePattern?: boolean;
  empty?: React.ReactNode;
}) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const router = useRouter();

  if (!hydrated) return <ProblemListSkeleton rows={Math.min(items.length || 6, 8)} />;
  if (!items.length) return <>{empty}</>;

  if (view === "cards") {
    return (
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(({ problem, topic, pattern, platform }) => {
          const e = progress[problem.slug];
          return (
            <li key={problem.slug}>
              <Link href={`/problems/${problem.slug}`} className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Panel interactive className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{problem.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{problem.takeaway}</p>
                    </div>
                    <StarButton slug={problem.slug} title={problem.title} starred={!!e?.starred} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <DifficultyBadge difficulty={problem.difficulty} />
                    {!hidePattern && <Tag>{pattern.name}</Tag>}
                    {!hideTopic && <Tag>{topic.name}</Tag>}
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <StatusBadge status={displayStatus(e)} />
                    <span className="font-mono">{platform}</span>
                  </div>
                </Panel>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Panel className="overflow-hidden">
      {/* Mobile: stacked rows */}
      <ul className="divide-y md:hidden">
        {items.map(({ problem, pattern }) => {
          const e = progress[problem.slug];
          return (
            <li key={problem.slug}>
              <Link
                href={`/problems/${problem.slug}`}
                className="flex items-center gap-3 px-4 py-3 outline-none focus-visible:bg-muted"
              >
                <StatusBadge status={displayStatus(e)} compact />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{problem.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{pattern.name}</span>
                </span>
                <DifficultyBadge difficulty={problem.difficulty} />
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-surface text-left text-xs text-muted-foreground">
              <th scope="col" className="w-8 py-2.5 pl-3 font-medium">
                <span className="sr-only">Favourite</span>
              </th>
              <th scope="col" className="py-2.5 pr-3 font-medium">Problem</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Difficulty</th>
              {!hideTopic && <th scope="col" className="px-3 py-2.5 font-medium">Topic</th>}
              {!hidePattern && <th scope="col" className="px-3 py-2.5 font-medium">Pattern</th>}
              <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Attempts</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Last solved</th>
              <th scope="col" className="px-3 py-2.5 pr-4 font-medium">Next revision</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ problem, topic, pattern }) => {
              const e = progress[problem.slug];
              const attempts = e?.history.length ?? 0;
              const href = `/problems/${problem.slug}`;
              return (
                <tr
                  key={problem.slug}
                  onClick={() => router.push(href)}
                  className="group cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50"
                >
                  <td className="py-2 pl-2">
                    <StarButton slug={problem.slug} title={problem.title} starred={!!e?.starred} />
                  </td>
                  <td className="max-w-[18rem] py-2.5 pr-3">
                    <Link
                      href={href}
                      onClick={(ev) => ev.stopPropagation()}
                      className="block truncate font-medium outline-none group-hover:text-primary focus-visible:underline"
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </td>
                  {!hideTopic && <td className="max-w-[10rem] truncate px-3 py-2.5 text-muted-foreground">{topic.name}</td>}
                  {!hidePattern && <td className="max-w-[14rem] truncate px-3 py-2.5 text-muted-foreground">{pattern.name}</td>}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <StatusBadge status={displayStatus(e)} />
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">{attempts || "—"}</td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap text-muted-foreground">{relativeDay(lastSolved(e))}</td>
                  <td className="px-3 py-2.5 pr-4 text-xs whitespace-nowrap">
                    <NextReview e={e} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function ProblemListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Panel className="divide-y" aria-busy="true" aria-label="Loading problems">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Shimmer className="size-4 rounded-full" />
          <Shimmer className="h-4 flex-1 max-w-64" />
          <Shimmer className="h-4 w-14" />
          <Shimmer className="hidden h-4 w-24 md:block" />
          <Shimmer className="hidden h-4 w-20 md:block" />
        </div>
      ))}
    </Panel>
  );
}

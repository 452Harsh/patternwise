"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Plus, Trash2, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DifficultyBadge, EmptyState, Meter, Panel, Ring, SectionTitle, Shimmer, Tag, pct } from "@/components/kit";
import { ProblemList } from "@/components/problem-list";
import { useCatalog } from "@/lib/catalog";
import { isSolved, removeCompany, updateCompany, useHydrated, useStore } from "@/lib/progress";

export default function CompanyPage() {
  const { id } = useParams<{ id: string }>();
  const state = useStore();
  const hydrated = useHydrated();
  const catalog = useCatalog();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState(false);

  if (!hydrated) return <Shimmer className="h-64 w-full rounded-xl" />;
  const company = state.companies.find((c) => c.id === id);
  if (!company) {
    return (
      <EmptyState
        icon={Building2}
        title="List not found"
        description="It may have been deleted."
        action={
          <Link href="/interview" className={buttonVariants({ size: "sm" })}>
            Back to Interview Prep
          </Link>
        }
      />
    );
  }

  const saved = catalog.filter((x) => company.slugs.includes(x.problem.slug));
  const solved = saved.filter((x) => isSolved(state.problems[x.problem.slug])).length;
  const byTopic = new Map<string, number>();
  const byPattern = new Map<string, { name: string; id: string; n: number }>();
  for (const x of saved) {
    byTopic.set(x.topic.name, (byTopic.get(x.topic.name) ?? 0) + 1);
    const cur = byPattern.get(x.pattern.id) ?? { name: x.pattern.name, id: x.pattern.id, n: 0 };
    byPattern.set(x.pattern.id, { ...cur, n: cur.n + 1 });
  }

  const needle = q.trim().toLowerCase();
  const results = needle
    ? catalog.filter((x) => !company.slugs.includes(x.problem.slug) && `${x.problem.title} ${x.pattern.name}`.toLowerCase().includes(needle)).slice(0, 8)
    : [];

  const add = (slug: string, title: string) => {
    updateCompany(company.id, { slugs: [...company.slugs, slug] });
    toast.success(`Added to ${company.name}`, { description: title });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/interview#companies" className="hover:text-foreground">
            Interview Prep
          </Link>
        </nav>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-xl bg-muted text-lg font-semibold">{company.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <input
                value={company.name}
                onChange={(e) => updateCompany(company.id, { name: e.target.value })}
                aria-label="List name"
                className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none focus-visible:underline sm:text-3xl"
              />
              <p className="text-sm text-muted-foreground">Your personal preparation list.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Ring value={saved.length ? solved / saved.length : 0} size={64} stroke={6} label={`${pct(saved.length ? solved / saved.length : 0)} solved`}>
              <span className="font-mono text-xs font-semibold">{pct(saved.length ? solved / saved.length : 0)}</span>
            </Ring>
            <Button variant="ghost" size="icon" aria-label="Delete list" onClick={() => setConfirm(true)}>
              <Trash2 />
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <section>
            <SectionTitle hint="Search the curriculum (and your own problems) to add them.">Saved problems</SectionTitle>
            <div className="relative mb-3">
              <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a problem…" aria-label="Search problems to add" />
              {results.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border bg-popover shadow-lg">
                  {results.map((x) => (
                    <li key={x.problem.slug}>
                      <button
                        type="button"
                        onClick={() => add(x.problem.slug, x.problem.title)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"
                      >
                        <Plus className="size-3.5 text-muted-foreground" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{x.problem.title}</span>
                        <span className="hidden truncate text-xs text-muted-foreground sm:inline">{x.pattern.name}</span>
                        <DifficultyBadge difficulty={x.problem.difficulty} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <ProblemList
              items={saved}
              empty={<EmptyState icon={Building2} title="No saved problems" description="Search above to add problems you want to prepare for this company." />}
            />
            {saved.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Remove problems">
                {saved.map((x) => (
                  <li key={x.problem.slug}>
                    <button
                      type="button"
                      onClick={() => updateCompany(company.id, { slugs: company.slugs.filter((s) => s !== x.problem.slug) })}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Remove ${x.problem.title}`}
                    >
                      {x.problem.title} <X className="size-3" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section>
            <SectionTitle>Notes</SectionTitle>
            <Textarea
              value={company.notes}
              onChange={(e) => updateCompany(company.id, { notes: e.target.value })}
              rows={6}
              placeholder="Interview format, recruiter notes, dates, what to focus on…"
              className="bg-surface"
              aria-label={`Notes for ${company.name}`}
            />
          </section>
          <section>
            <SectionTitle>Topics</SectionTitle>
            {byTopic.size ? (
              <div className="flex flex-wrap gap-1.5">
                {[...byTopic.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => (
                  <Tag key={name}>
                    {name} · {n}
                  </Tag>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Add problems to see coverage.</p>
            )}
          </section>
          <section>
            <SectionTitle>Patterns</SectionTitle>
            {byPattern.size ? (
              <Panel className="space-y-2.5 p-3">
                {[...byPattern.values()].sort((a, b) => b.n - a.n).map((p) => (
                  <Link key={p.id} href={`/patterns/${p.id}`} className="block text-sm hover:text-primary">
                    <span className="flex justify-between">
                      <span className="truncate">{p.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{p.n}</span>
                    </span>
                    <Meter value={p.n / saved.length} tone="info" className="mt-1 h-1" label={`${p.name} share`} />
                  </Link>
                ))}
              </Panel>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </section>
        </aside>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the {company.name} list?</AlertDialogTitle>
            <AlertDialogDescription>The problems stay in your library; only this list and its notes are removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                removeCompany(company.id);
                router.push("/interview#companies");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

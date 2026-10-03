"use client";

import { useState } from "react";
import { SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader, SectionTitle } from "@/components/kit";
import { SDCardGrid } from "@/components/sd/item-cards";
import { SD_ITEMS, type SDItem } from "@/data/sd";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "all", label: "All" },
  { id: "hld", label: "Architecture (HLD)" },
  { id: "lld", label: "Design patterns (LLD)" },
] as const;

const GROUPS: { title: string; hint: string; test: (x: SDItem) => boolean }[] = [
  { title: "Architecture patterns", hint: "Distributed-systems solutions for scale, consistency and resilience.", test: (x) => x.track === "hld" },
  { title: "Creational", hint: "Decouple object creation from use.", test: (x) => x.track === "lld" && x.group === "Creational" },
  { title: "Structural", hint: "Compose classes and objects into larger structures.", test: (x) => x.track === "lld" && x.group === "Structural" },
  { title: "Behavioral", hint: "Distribute responsibilities and communication.", test: (x) => x.track === "lld" && x.group === "Behavioral" },
];

export default function SDPatternsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const patterns = SD_ITEMS.filter(
    (x) => x.kind === "pattern" && (tab === "all" || x.track === tab) && (!needle || `${x.title} ${x.summary}`.toLowerCase().includes(needle)),
  );

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="System Design" title="Pattern Library" subtitle="Architecture patterns for HLD and the classic object-oriented design patterns for LLD." />
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border p-0.5" role="tablist" aria-label="Pattern type">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "h-7 rounded-md px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                tab === t.id ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patterns…" aria-label="Search patterns" className="w-full sm:w-64" />
      </div>
      {patterns.length === 0 ? (
        <EmptyState icon={SearchX} title="No patterns match" description="Try a different search." />
      ) : (
        GROUPS.map((g) => {
          const items = patterns.filter(g.test);
          if (!items.length) return null;
          return (
            <section key={g.title}>
              <SectionTitle hint={g.hint}>{g.title}</SectionTitle>
              <SDCardGrid items={items} />
            </section>
          );
        })
      )}
    </div>
  );
}

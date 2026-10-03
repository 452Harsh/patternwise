"use client";

import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/kit";
import { NativeSelect } from "@/components/native-select";
import { SDItemList } from "@/components/sd/sd-kit";
import { SD_CATEGORIES, SD_ITEMS } from "@/data/sd";
import { SD_CONFIDENCE, isSDDue, useStore } from "@/lib/progress";

export default function ConceptsPage() {
  const state = useStore();
  const [q, setQ] = useState("");
  const [track, setTrack] = useState("all");
  const [category, setCategory] = useState("all");
  const [confidence, setConfidence] = useState("all");

  const concepts = SD_ITEMS.filter((x) => x.kind === "concept");
  const categories = SD_CATEGORIES.filter((c) => track === "all" || c.track === track);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return concepts.filter((x) => {
      const e = state.sd[x.key];
      if (needle && !`${x.title} ${x.summary} ${x.group}`.toLowerCase().includes(needle)) return false;
      if (track !== "all" && x.track !== track) return false;
      if (category !== "all" && x.group !== SD_CATEGORIES.find((c) => c.id === category)?.name) return false;
      if (confidence === "unrated" && e?.confidence) return false;
      if (confidence === "low" && !(e?.confidence && e.confidence <= 2)) return false;
      if (confidence === "strong" && !((e?.confidence ?? 0) >= 4)) return false;
      if (confidence === "due" && !isSDDue(e)) return false;
      return true;
    });
  }, [concepts, state.sd, q, track, category, confidence]);

  return (
    <div className="space-y-6">
      <PageHeader title="Concepts" subtitle="Every HLD and LLD concept in one searchable library." eyebrow="System Design" />
      <div className="flex flex-wrap items-center gap-2">
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search concepts…" aria-label="Search concepts" className="w-full sm:w-72" />
        <NativeSelect
          aria-label="Track"
          value={track}
          onChange={(e) => {
            setTrack(e.target.value);
            setCategory("all");
          }}
        >
          <option value="all">HLD + LLD</option>
          <option value="hld">HLD</option>
          <option value="lld">LLD</option>
        </NativeSelect>
        <NativeSelect aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Confidence" value={confidence} onChange={(e) => setConfidence(e.target.value)}>
          <option value="all">Any confidence</option>
          <option value="unrated">{SD_CONFIDENCE[0]}</option>
          <option value="low">Low (Don&apos;t know / Familiar)</option>
          <option value="strong">Strong (Can explain / Can apply)</option>
          <option value="due">Due for review</option>
        </NativeSelect>
        <span className="text-sm text-muted-foreground">
          <span className="font-mono text-foreground">{rows.length}</span> concepts
        </span>
      </div>
      <SDItemList items={rows} empty={<EmptyState icon={SearchX} title="No concepts match" description="Try another search or filter." />} />
    </div>
  );
}

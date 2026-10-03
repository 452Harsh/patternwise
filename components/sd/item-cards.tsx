"use client";

import Link from "next/link";
import { Confidence, DifficultyBadge, Meter, Panel, Tag, masteryTone, pct } from "@/components/kit";
import type { SDItem } from "@/data/sd";
import { isSDDue, useHydrated, useStore } from "@/lib/progress";
import { sdScore } from "@/lib/sd";
import { cn } from "@/lib/utils";
import { SDStatusBadge, TrackTag } from "./sd-kit";

/** Card grid for SD items. Same visual language as DSA pattern cards. */
export function SDCardGrid({ items, showTrack, cols = 3 }: { items: SDItem[]; showTrack?: boolean; cols?: 2 | 3 }) {
  const state = useStore();
  const hydrated = useHydrated();
  return (
    <ul className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", cols === 3 && "xl:grid-cols-3")}>
      {items.map((x) => {
        const e = hydrated ? state.sd[x.key] : undefined;
        const due = isSDDue(e);
        return (
          <li key={x.key}>
            <Link href={x.href} className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Panel interactive className="flex h-full flex-col gap-2.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{x.group}</p>
                    <p className="mt-0.5 font-medium leading-snug">{x.title}</p>
                  </div>
                  {x.difficulty ? <DifficultyBadge difficulty={x.difficulty} /> : showTrack ? <TrackTag track={x.track} /> : null}
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{x.summary}</p>
                <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2.5 text-xs">
                  <SDStatusBadge entry={e} />
                  <span className="flex items-center gap-2">
                    {due && <Tag className="bg-warning/10 text-warning">due</Tag>}
                    <Confidence value={e?.confidence ?? 0} />
                  </span>
                </div>
              </Panel>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Header strip for a category: name, blurb, mastery meter. */
export function CategoryHeader({ id, name, blurb, itemKeys }: { id: string; name: string; blurb: string; itemKeys: string[] }) {
  const state = useStore();
  const hydrated = useHydrated();
  const mastery = itemKeys.length ? itemKeys.reduce((a, k) => a + sdScore(state.sd[k]), 0) / itemKeys.length : 0;
  const started = itemKeys.filter((k) => state.sd[k]?.history.length).length;
  return (
    <div id={id} className="mb-3 flex scroll-mt-20 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{name}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{blurb}</p>
      </div>
      <div className="w-full shrink-0 sm:w-48">
        <div className="mb-1 flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>
            {hydrated ? started : 0}/{itemKeys.length} started
          </span>
          <span>{hydrated ? pct(mastery) : "—"}</span>
        </div>
        <Meter value={hydrated ? mastery : 0} tone={masteryTone(mastery)} label={`${name} mastery`} />
      </div>
    </div>
  );
}

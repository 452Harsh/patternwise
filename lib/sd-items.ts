import { SD_ITEMS, sdKey, type SDItem } from "@/data/sd";
import type { State } from "./progress";

/** System Design catalog: curated items plus the user's custom problems and diagrams. Pure. */
export function sdItemsFor(state: State): SDItem[] {
  const custom: SDItem[] = state.sdCustom.map((c) => ({
    key: sdKey("problem", c.id),
    kind: "problem",
    id: c.id,
    track: c.track,
    title: c.title,
    group: c.track === "hld" ? "HLD problem" : "LLD problem",
    href: `/system-design/problems/${c.id}`,
    difficulty: c.difficulty,
    summary: c.statement,
  }));
  const diagrams: SDItem[] = Object.values(state.diagrams).map((d) => ({
    key: sdKey("diagram", d.id),
    kind: "diagram",
    id: d.id,
    track: "hld",
    title: d.title,
    group: "Architecture diagram",
    href: `/system-design/architecture/${d.id}`,
    summary: d.notes || `${d.nodes.length} components · ${d.edges.length} connections`,
  }));
  return [...SD_ITEMS, ...custom, ...diagrams];
}


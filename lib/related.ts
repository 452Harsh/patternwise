import { patternIndex } from "@/data/curriculum";
import { COVERAGE } from "@/data/coverage";
import type { Pattern, Topic } from "@/data/types";

/** Patterns that share a coverage area or a topic with `id`, closest first. */
export function relatedPatterns(id: string, limit = 6): { pattern: Pattern; topic: Topic; why: string }[] {
  const self = patternIndex.get(id);
  if (!self) return [];
  const out = new Map<string, { pattern: Pattern; topic: Topic; why: string }>();
  for (const c of COVERAGE) {
    if (!c.patterns.includes(id)) continue;
    for (const other of c.patterns) {
      const meta = patternIndex.get(other);
      if (other !== id && meta && !out.has(other)) out.set(other, { ...meta, why: c.area });
    }
  }
  for (const p of self.topic.patterns) {
    if (p.id !== id && !out.has(p.id)) out.set(p.id, { pattern: p, topic: self.topic, why: `Also in ${self.topic.name}` });
  }
  return [...out.values()].slice(0, limit);
}

/** Leading sentences of the approach, at least ~60 characters, for cards and lists. */
export function shortDescription(p: Pattern): string {
  const sentences = p.approach.split(/(?<=\.)\s/);
  let out = "";
  for (const s of sentences) {
    out = out ? `${out} ${s}` : s;
    if (out.length >= 60) break;
  }
  return out;
}

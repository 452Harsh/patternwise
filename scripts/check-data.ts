import { allPatterns, allProblems, topics } from "../data/curriculum";
import { COVERAGE } from "../data/coverage";
import { IMPORTANT } from "../data/important";
import { COMPLEXITY } from "../data/pattern-meta";
import { PHASES } from "../data/study-plan";
import { ALL_CONCEPTS, HLD_PATTERNS, HLD_PROBLEMS, LLD_PATTERNS, LLD_PROBLEMS, SD_ITEMS } from "../data/sd";
import { HLD_CATEGORIES, HLD_PATTERN_IDS, HLD_PROBLEM_IDS, LLD_CATEGORIES, LLD_PATTERN_IDS, LLD_PROBLEM_IDS } from "../data/sd/ids";

const errors: string[] = [];
const dup = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i);

for (const d of dup(allProblems.map((x) => x.problem.slug))) errors.push(`duplicate problem slug: ${d}`);
for (const d of dup(allPatterns.map((x) => x.pattern.id))) errors.push(`duplicate pattern id: ${d}`);
for (const d of dup(topics.map((t) => t.id))) errors.push(`duplicate topic id: ${d}`);

const slugs = new Set(allProblems.map((x) => x.problem.slug));
const pids = new Set(allPatterns.map((x) => x.pattern.id));

for (const { pattern } of allPatterns) {
  if (!pattern.transfer?.length) errors.push(`pattern ${pattern.id} has no transfer notes`);
  if (!pattern.problems.length) errors.push(`pattern ${pattern.id} has no problems`);
  if (!COMPLEXITY[pattern.id]) errors.push(`pattern ${pattern.id} has no complexity entry`);
}
for (const s of IMPORTANT) if (!slugs.has(s)) errors.push(`important slug not in curriculum: ${s}`);
for (const d of dup(IMPORTANT)) errors.push(`duplicate important slug: ${d}`);
for (const c of COVERAGE) for (const p of c.patterns) if (!pids.has(p)) errors.push(`coverage "${c.area}" -> unknown pattern ${p}`);

const phased = PHASES.flatMap((p) => p.topicIds);
for (const id of phased) if (!topics.some((t) => t.id === id)) errors.push(`study plan references unknown topic ${id}`);
for (const t of topics) if (!phased.includes(t.id)) errors.push(`topic ${t.id} is not in any study-plan phase`);
for (const id of Object.keys(COMPLEXITY)) if (!pids.has(id)) errors.push(`complexity entry for unknown pattern ${id}`);

const covered = new Set(COVERAGE.flatMap((c) => c.patterns));
const uncovered = [...pids].filter((p) => !covered.has(p));
if (uncovered.length) console.log("patterns not referenced by COVERAGE:", uncovered.join(", "));

/* ---------- System Design ---------- */
const sdIds = (xs: { id: string }[]) => xs.map((x) => x.id);
for (const d of dup(sdIds(ALL_CONCEPTS))) errors.push(`duplicate SD concept id: ${d}`);
for (const d of dup([...sdIds(HLD_PATTERNS), ...sdIds(LLD_PATTERNS)])) errors.push(`duplicate SD pattern id: ${d}`);
for (const d of dup([...sdIds(HLD_PROBLEMS), ...sdIds(LLD_PROBLEMS)])) errors.push(`duplicate SD problem id: ${d}`);
for (const d of dup(SD_ITEMS.map((x) => x.key))) errors.push(`duplicate SD key: ${d}`);

const expectConcepts = [...Object.values(HLD_CATEGORIES).flat(), ...Object.values(LLD_CATEGORIES).flat()] as string[];
const conceptIds = new Set(sdIds(ALL_CONCEPTS));
for (const id of expectConcepts) if (!conceptIds.has(id)) errors.push(`missing SD concept ${id}`);
const expectPatterns = [...HLD_PATTERN_IDS, ...Object.values(LLD_PATTERN_IDS).flat()] as string[];
for (const id of expectPatterns) if (![...HLD_PATTERNS, ...LLD_PATTERNS].some((p) => p.id === id)) errors.push(`missing SD pattern ${id}`);
for (const id of [...HLD_PROBLEM_IDS, ...LLD_PROBLEM_IDS] as string[]) if (![...HLD_PROBLEMS, ...LLD_PROBLEMS].some((p) => p.id === id)) errors.push(`missing SD problem ${id}`);

const hldPatternIds = new Set(sdIds(HLD_PATTERNS));
const lldPatternIds = new Set(sdIds(LLD_PATTERNS));
const hldProblemIds = new Set(sdIds(HLD_PROBLEMS));
const lldProblemIds = new Set(sdIds(LLD_PROBLEMS));
const flowOk = (where: string, f?: { nodes: { id: string }[]; edges: { from: string; to: string }[] }) => {
  if (!f) return;
  const ids = new Set(f.nodes.map((n) => n.id));
  for (const e of f.edges) if (!ids.has(e.from) || !ids.has(e.to)) errors.push(`${where}: flow edge ${e.from}→${e.to} has no node`);
};
for (const c of ALL_CONCEPTS) {
  for (const r of c.related) if (!conceptIds.has(r) || r === c.id) errors.push(`concept ${c.id} → bad related ${r}`);
  flowOk(`concept ${c.id}`, c.flow);
}
for (const p of HLD_PATTERNS) {
  for (const c of p.concepts) if (!conceptIds.has(c)) errors.push(`HLD pattern ${p.id} → unknown concept ${c}`);
  for (const x of p.problems) if (!hldProblemIds.has(x)) errors.push(`HLD pattern ${p.id} → unknown problem ${x}`);
  flowOk(`HLD pattern ${p.id}`, p.diagram);
}
for (const p of LLD_PATTERNS) {
  for (const r of p.related) if (!lldPatternIds.has(r) || r === p.id) errors.push(`LLD pattern ${p.id} → bad related ${r}`);
  for (const x of p.problems) if (!lldProblemIds.has(x)) errors.push(`LLD pattern ${p.id} → unknown problem ${x}`);
  const names = new Set(p.uml.classes.map((c) => c.name));
  for (const r of p.uml.relations) if (!names.has(r.from) || !names.has(r.to)) errors.push(`LLD pattern ${p.id}: UML relation ${r.from}→${r.to} has no class`);
  if (!p.code.python.trim()) errors.push(`LLD pattern ${p.id} missing code`);
}
for (const p of HLD_PROBLEMS) {
  for (const c of p.concepts) if (!conceptIds.has(c)) errors.push(`HLD problem ${p.id} → unknown concept ${c}`);
  for (const x of p.patterns) if (!hldPatternIds.has(x)) errors.push(`HLD problem ${p.id} → unknown pattern ${x}`);
}
for (const p of LLD_PROBLEMS) {
  for (const c of p.concepts) if (!conceptIds.has(c)) errors.push(`LLD problem ${p.id} → unknown concept ${c}`);
  for (const x of p.patterns) if (!lldPatternIds.has(x)) errors.push(`LLD problem ${p.id} → unknown pattern ${x}`);
}
console.log(`System Design: ${ALL_CONCEPTS.length} concepts, ${HLD_PATTERNS.length + LLD_PATTERNS.length} patterns, ${HLD_PROBLEMS.length + LLD_PROBLEMS.length} problems`);

console.log(`${topics.length} topics, ${allPatterns.length} patterns, ${allProblems.length} problems, ${new Set(IMPORTANT).size} important`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("OK");

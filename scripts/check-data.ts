import { allPatterns, allProblems, topics } from "../data/curriculum";
import { COVERAGE } from "../data/coverage";
import { IMPORTANT } from "../data/important";
import { COMPLEXITY } from "../data/pattern-meta";
import { PHASES } from "../data/study-plan";

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

console.log(`${topics.length} topics, ${allPatterns.length} patterns, ${allProblems.length} problems, ${new Set(IMPORTANT).size} important`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("OK");

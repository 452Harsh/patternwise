/** Checks every curriculum slug against LeetCode's public GraphQL endpoint. */
import { allProblems } from "../data/curriculum";

const Q = "query($s:String!){question(titleSlug:$s){title difficulty isPaidOnly}}";

async function lookup(slug: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "content-type": "application/json", referer: "https://leetcode.com" },
        body: JSON.stringify({ query: Q, variables: { s: slug } }),
      });
      if (res.ok) return (await res.json()).data.question as null | { title: string; difficulty: string; isPaidOnly: boolean };
    } catch {}
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }
  return undefined; // network failure
}

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
const issues: string[] = [];
const queue = [...allProblems];

async function worker() {
  for (let item = queue.shift(); item; item = queue.shift()) {
    const { problem } = item;
    const q = await lookup(problem.slug);
    if (q === undefined) issues.push(`UNREACHABLE  ${problem.slug}`);
    else if (q === null) issues.push(`NOT FOUND    ${problem.slug}  (${problem.title})`);
    else {
      if (q.isPaidOnly) issues.push(`PREMIUM      ${problem.slug}`);
      if (q.difficulty !== problem.difficulty) issues.push(`DIFFICULTY   ${problem.slug}: ours ${problem.difficulty}, LeetCode ${q.difficulty}`);
      if (norm(q.title) !== norm(problem.title)) issues.push(`TITLE        ${problem.slug}: ours "${problem.title}", LeetCode "${q.title}"`);
    }
  }
}

async function main() {
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(issues.sort().join("\n") || "All slugs verified.");
  console.log(`\nChecked ${allProblems.length} problems, ${issues.length} issues.`);
  process.exit(issues.some((i) => /^(NOT FOUND|UNREACHABLE|PREMIUM)/.test(i)) ? 1 : 0);
}

main();

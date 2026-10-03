/**
 * Build or refresh the coach's knowledge index (curriculum only) from the command line.
 * Run: npm run coach:index   (uses MONGODB_URI / MONGODB_DB / AI_* from .env.local)
 */
import { buildKnowledgeIndex } from "../lib/server/rag/indexer";

async function main() {
  const started = Date.now();
  const result = await buildKnowledgeIndex((done, todo) => process.stdout.write(`\rEmbedded ${done}/${todo}`));
  console.log(`\n${JSON.stringify(result, null, 2)}\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);

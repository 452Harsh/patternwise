@AGENTS.md

# Claude Code notes

Everything in AGENTS.md applies. These notes are specific to working in this repo with Claude Code.

## Safety

- **Secrets:** they live only in `.env.local`, which git ignores. Never print, log, commit or paste `MONGODB_URI`, `APP_PASSWORD` or `SESSION_SECRET`.
- **Databases:**
  - `patternwise` is the owner's real data. Never run experiments, scripts or browser tests against it.
  - For tests, start a separate server with `MONGODB_DB=patternwise_test` on another port (for example `npm run build && MONGODB_DB=patternwise_test npx next start -p 3200`).
- **Git:**
  - Commit or push only when asked.
  - A push to the default branch redeploys production on Vercel.
  - The remote is the private GitHub repo `patternwise`.
- **Data changes:** one-off scripts that touch real user data (recounts, migrations) need explicit confirmation first.

## Working habits

- **Dev server:** the owner usually keeps `npm run dev` running on port 3000. Don't start a second one on the same port; check first.
- **After moving or renaming routes:** stale `.next/types` can cause type errors. Delete `.next` and rebuild.
- **AGENTS.md:** `next dev` rewrites the block between the `nextjs-agent-rules` markers. Edit only below the END marker.
- **UI checks:** check new UI at a 375px mobile width and a desktop width, in dark mode (the default).
- **Verifying claims:** check what you say about behaviour against the code. Mark items in `docs/roadmap.md` as done only after you've verified them.

# Patternwise — DSA workspace

A personal, pattern-first DSA and interview preparation workspace built with Next.js 16, TypeScript, Tailwind CSS v4 and shadcn/ui (Base UI).

It pairs a curated curriculum (27 topics, 112 patterns, 364 LeetCode problems, verified against LeetCode's API) with a tracker built around pattern recognition: every pattern documents how to spot it, the core idea, a template, variations, pitfalls, complexity and where else it applies.

## Run

```bash
npm install
cp .env.example .env.local   # then fill in MongoDB URI, APP_PASSWORD, SESSION_SECRET
npm run dev                  # http://localhost:3000 → sign in with APP_PASSWORD
```

## Backend

The backend is Node.js inside Next.js (route handlers + `proxy.ts`), backed by MongoDB.

- **Auth** — single user. `POST /api/auth/login` checks `APP_PASSWORD` (constant-time) and sets an HMAC-signed, httpOnly, SameSite=Lax session cookie (30 days). `proxy.ts` redirects every page to `/login` and returns 401 for every API call without a valid session. Five failed logins lock an IP for 15 minutes.
- **API** — `GET /api/state` returns everything; `PATCH /api/state` applies a change set validated with zod (`lib/server/schemas.ts`). Only JSON bodies are accepted.
- **Collections** — `problem_progress` and `pattern_progress` (one document per problem/pattern, `_id` = slug/id), `custom_problems`, `companies`, `mock_interviews`, `activity`, and a single `meta` document (daily plans, checklist, settings).
- **Client sync** — `lib/progress.ts` keeps the UI instant: edits apply locally, then only the changed documents are sent (debounced, retried with backoff). A local copy in `localStorage` covers offline use and reloads before a save lands (a "dirty" marker makes the next load re-send unsaved edits). On first run against an empty database, progress already saved in the browser is uploaded automatically.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm run lint` | ESLint (incl. React Compiler rules) |
| `npm run check:data` | Curriculum integrity: unique slugs/ids, every pattern has transfer notes + complexity, coverage and study-plan references resolve |
| `npm run verify:links` | Checks every problem slug against LeetCode's public GraphQL API (exists, not premium, title and difficulty match) |

## Pages

Dashboard · Problems (table/card views, filters, sort, custom problems) · Problem workspace · Topics · Pattern Library · Study Plan · Revision (spaced repetition) · Progress (analytics + coverage/gap analysis) · Notes · Interview Prep (readiness, timed practice, mocks, company lists, checklist) · Settings.

Keyboard: `⌘K` search everything, `G` then a letter to navigate (`G P` problems, `G R` revision, …), `?` for help. `⌘P`/`⌘R` are left to the browser.

## Data

- **Curriculum** — `data/` (plain TypeScript). `topics-*.ts` hold patterns and problems, `curriculum.ts` composes the study order, `important.ts` is the interview-essentials list, `coverage.ts` maps interview areas to patterns, `pattern-meta.ts` holds typical complexity, `study-plan.ts` the five phases.
- **Your progress** — stored in MongoDB (see Backend). Export/import a JSON snapshot from Settings. Progress is keyed by problem slug, so curriculum edits keep your history.

Problem statements are not reproduced (they belong to LeetCode); each problem links to the original and has a field for restating it in your own words.

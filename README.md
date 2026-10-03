# Patternwise

[![CI](https://github.com/452Harsh/patternwise/actions/workflows/ci.yml/badge.svg)](https://github.com/452Harsh/patternwise/actions/workflows/ci.yml)

A personal, pattern-first preparation workspace for **DSA** (data structures and algorithms) and **System Design** (HLD and LLD). It combines a curated curriculum with a tracker built around recognition, spaced-repetition revision, daily plans, notes, workspaces and analytics, plus an **AI interview coach** that runs on open-weight models and answers: *"Given everything I've practised, what should I do today?"*

It's built with Next.js 16, React 19 and TypeScript, styled with Tailwind CSS v4 and shadcn/ui on Base UI, and stores data in MongoDB. It's a single-user app that you sign in to with a password.

---

## Why

Most practice tracking is a checklist of problems. Patternwise is organised around the **pattern** instead: how to recognise it, the core idea, a template, variations, pitfalls and where else it applies. Every solve, review and note feeds a spaced-repetition schedule, so things you're shaky on come back before you forget them. System Design gets the same treatment, with concepts, architecture and design patterns, and design problems, each with its own workspace.

## Features at a glance

**DSA module** (`/`)
- **Curriculum:** 27 topics, 112 patterns, 364 LeetCode problems (slugs verified against LeetCode) and 119 interview essentials.
- **Problem workspace:** restate the problem in your own words, then record your approach, code, complexity, mistakes, notes and attempt history.
- **Practice:** revision queues, a pattern library, a 5-phase study plan and a daily plan.
- **Interview prep:** a readiness score, timed practice, mock interviews and company lists.
- **Tracking:** progress, analytics, coverage and notes.

**System Design module** (`/system-design`)
- **Content:** 77 concepts (54 HLD, 23 LLD), 16 architecture patterns, 19 GoF design patterns (UML plus Java and Python), and 34 design problems (17 HLD, 17 LLD).
- **HLD workspace:** a capacity calculator, API and data-model design, an architecture diagram editor, scaling prompts and trade-offs.
- **LLD workspace:** actors, use cases, classes, relationships, a generated UML diagram, patterns, code and a design review.
- **Revision and completion:** rate items from Forgot to Mastered, Mark as complete, stop or resume reviews per item, and a timed interview mode with debriefs.
- **Tracking:** its own dashboard, plan, revision, progress, analytics and notes.

**AI Coach module** (`/coach`)
- **Today's plan:** a deterministic engine analyses attempts, hints, failures, ratings, reviews and recency, and explains every priority. It knows when *not* to give you another problem.
- **Open models:** Gemma 4 E2B explains the plan, answers questions about your own history, spots patterns, gives progressive hints, grades your explanations and acts as a DSA/HLD/LLD interviewer.
- **RAG:** EmbeddingGemma vectors over the curriculum, with MongoDB Atlas Vector Search.
- **Private and swappable:** runs locally with Ollama (private, free, offline). You can swap in any OpenAI-compatible open-model host.

**Shared**
- **Module switching:** DSA and System Design are independent, and AI Coach is the third module (`G 1` / `G 2` / `G 3`), and search and shortcuts are scoped to the active module (`⌘K`, `G` + key, `?`).
- **Sync:** edits apply instantly and save in the background. Unsaved edits survive going offline.
- **Look and layout:** dark-first, responsive (the mobile layout has bottom tabs).
- **Settings:** export and import JSON backups.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI, APP_PASSWORD, SESSION_SECRET
npm run dev                  # http://localhost:3000 → sign in with APP_PASSWORD
```

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB` | Database name (default `patternwise`) |
| `APP_PASSWORD` | Login password |
| `SESSION_SECRET` | 32+ random characters for signing the session cookie |

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Development server, production build, production server |
| `npm run lint` | ESLint (including the React Compiler rules) |
| `npm run check:data` | Curriculum integrity checks for DSA and System Design |
| `npm run verify:links` | Verifies every DSA problem slug against LeetCode |
| `npm run check:coach` | Deterministic checks of the AI Coach recommendation engine |
| `npm run coach:index` | Builds the AI Coach knowledge index (curriculum → embeddings → Atlas Vector Search) |

**AI Coach (optional):** `brew install ollama && ollama serve`, then `ollama pull gemma4:e2b-it-qat && ollama pull embeddinggemma`. Open `/coach` and click the status chip → **Build knowledge base**. The `AI_*` variables in `.env.example` switch models or point at a hosted open-model server.

Deployment: Vercel plus MongoDB Atlas. See [docs/development.md](docs/development.md#2-deploying-to-vercel).

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack, `proxy.ts`), React 19.2 |
| Language | TypeScript (strict) |
| UI | Tailwind CSS v4, shadcn/ui 4 on `@base-ui/react`, lucide-react, sonner, cmdk, next-themes |
| Charts and code | recharts 3, prism-react-renderer |
| Backend | Next.js route handlers on the Node.js runtime |
| Database | MongoDB Atlas via the official `mongodb` 7 driver |
| Validation | zod 4 |
| AI | Gemma 4 E2B + EmbeddingGemma (open weights) via Ollama or any OpenAI-compatible server; MongoDB Atlas Vector Search; react-markdown |
| Tooling | ESLint (`eslint-config-next`), `tsx` for scripts |

## How it fits together

```
data/ (static curriculum) ──┐
                            ▼
pages (app/(app)/…) ── hooks ──► lib/progress.ts (client store, localStorage copy)
                                     │ debounced diff
                                     ▼
                     proxy.ts (session) → /api/state → lib/server/repo.ts → MongoDB
```

The curriculum ships in the bundle. Only your progress, notes, workspaces, diagrams, settings and activity are stored in MongoDB, keyed by stable ids.

## Documentation

| Doc | Read it for |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Layers, data flow, sync, auth, module separation, rendering |
| [docs/database.md](docs/database.md) | Collections, document shapes, conventions, MongoDB setup |
| [docs/api.md](docs/api.md) | Auth and state endpoints |
| [docs/dsa.md](docs/dsa.md) | DSA curriculum, pages, progress model, metrics, daily plan |
| [docs/system-design.md](docs/system-design.md) | SD module: content, item keys, pages, progress model, metrics |
| [docs/hld.md](docs/hld.md) | HLD concepts, patterns, problems, HLD workspace, architecture editor |
| [docs/lld.md](docs/lld.md) | LLD concepts, GoF patterns, problems, LLD workspace, UML renderer |
| [docs/ui-architecture.md](docs/ui-architecture.md) | Design system, tokens, reusable components, shell, UI conventions |
| [docs/development.md](docs/development.md) | Setup, env, Vercel, folder structure, conventions, how-tos, **guide for AI assistants** |
| [docs/roadmap.md](docs/roadmap.md) | **Current state**: implemented, partial and missing; known bugs; tech debt; next steps; what not to change |
| [docs/ai-coach.md](docs/ai-coach.md) | AI Coach: recommendation engine, signals, model choice, RAG, prompts, feedback loop |
| [docs/decisions.md](docs/decisions.md) | Why things are built the way they are |

New to the codebase? Read `architecture.md`, then `development.md`, then the doc for the module you're changing. **AI assistants** should also read `AGENTS.md` (Next.js 16 differs from older versions) and §7 of `development.md`.

## Content note

Problem statements are not reproduced; they belong to LeetCode. Each problem links to the original and has a field for restating it in your own words.

## Contributing

This is a personal project in a private repository. Changes should:
- pass `npm run lint`, `npm run check:data` and `npm run build`;
- follow the conventions in [docs/development.md](docs/development.md);
- update [docs/roadmap.md](docs/roadmap.md), and any other affected doc, in the same change.

# AI Coach

The AI Coach answers one question: **"Given everything I've practised so far, what should I learn, revise or practise today?"**

It is built as a third module (`/coach`) on top of the existing DSA and System Design data. It adds no parallel tracking. Every user-specific claim comes from data the platform already records; the language model explains and coaches, it doesn't compute.

```
progress in MongoDB ──► deterministic recommendation engine (lib/coach/*) ──► structured facts + plan
                                                                                   │
user question ──► EmbeddingGemma ──► Atlas Vector Search (curriculum only) ──► knowledge
                                                                                   ▼
                                                     prompt (facts + knowledge + rules) ──► open-weight LLM (Gemma 4)
                                                                                   ▼
                       user practises ──► attempts/ratings/sessions saved ──► tomorrow's analysis changes
```

## 1. Design principles

- **The engine decides, the model explains.** Priorities, weak areas, difficulty moves and problem picks are computed in plain TypeScript (`lib/coach/`). The model receives them as facts and is told never to invent statistics.
- **Every score is explainable.** A priority is the sum of named signals with fixed weights. The UI shows the breakdown (`PriorityBadge`). There's no opaque "AI score".
- **Modules stay separate.** A coach request carries `ctx: "dsa" | "sd"`. DSA requests use only DSA progress and DSA knowledge, and SD requests use only SD data. `analyzeSD` never reads `state.problems`, and `scripts/check-coach.ts` asserts that SD data can't leak into the DSA analysis.
- **Open models, swappable.** Chat and embeddings go through small interfaces (`lib/ai/types.ts`). Changing model or host is a config change.
- **Privacy.** The vector store holds curriculum content only. Progress, notes, sessions and conversations are never indexed. The coach reads user data from MongoDB on the server, per request.

## 2. Recommendation engine (`lib/coach/`)

Pure functions with no React and no server-only code. The coach pages run them on the client for instant rendering, and the API runs them on the server from the stored progress before calling the model.

| File | Purpose |
|---|---|
| `types.ts` | `CoachPrefs`, `Signal`, `PatternFacts`, `DSARecommendation`, `SDFacts`, `SDRecommendation`, `ModulePlan`, `CoachPlan` |
| `dsa.ts` | `patternFacts`, `analyzeDSA` |
| `sd.ts` | `sdFacts`, `analyzeSD` |
| `plan.ts` | `buildCoachPlan` (timed steps per module), `prefsOf`, `interviewDaysLeft` |
| `interview.ts` | Interview stages for DSA and HLD/LLD |

### DSA: facts per pattern (`patternFacts`)
The facts come from the curated problems of the pattern plus the user's custom problems filed under it:
- solved, mastered, attempts;
- success rate over the last 21 days, where solved or reviewed counts 1, hints 0.5 and failed 0;
- failures and hint usage, and the number of distinct problems struggled on;
- average confidence, due count and the most overdue day;
- days since last practice and the self-rating;
- variation coverage: each curated problem teaches one variation (its `takeaway`), so solved/total is variation coverage;
- per-difficulty solved and recent success;
- the user's own `mistakes` notes;
- the last 5 attempts.

### DSA: priority (0–100)
| Signal | Weight | Derived from |
|---|---|---|
| Due for revision | 25 | problems due, days overdue |
| Weakness | 30 | low recent success, low confidence, failures/hints, "needs practice" self-rating |
| Time since practice | 15 | days since last attempt (starts after 3 days, full at 21) |
| Interview importance | 10 | `COVERAGE` tier (core / common / advanced) |
| Variation coverage | 10 | unsolved share of the pattern's variations |
| Recent performance | 10 | latest attempts worse than the pattern average |

### DSA: action and difficulty
- **Stop rule (`review-concept`):** applies when there are 3 or more shaky attempts across 2 or more problems in 21 days, recent success is below 50%, and 2 of the last 3 attempts were shaky. The coach then recommends **one** guided problem and says *not* to solve more ("the coach knows when not to recommend another problem").
- **Other actions:**
  - `strengthen`: weakness ≥ 0.4.
  - `revise`: something is due.
  - `advance` / `broaden`: ≥ 80% success, confidence ≥ 4 and ≥ 3 solved; `broaden` when many variations are still unsolved.
  - `learn`: an untouched pattern, next in study order.
- **Difficulty:**
  - Recent success ≥ 80% on 2+ attempts at the current level → harder.
  - Below 40% → easier.
  - Stuck → back to Easy fundamentals.
  - A preference set in the coach settings overrides all of this.
- **Focus:**
  - The top-priority pattern is chosen when it's urgent, meaning any of: priority ≥ 35, the stop rule applies, anything is due, or an interview is within 14 days.
  - Otherwise the next new pattern is chosen.
  - A secondary "after today's session" pick prefers due or stale patterns.

### System Design
Facts per item:
- rating history and review count;
- due date, honouring `reviewOff`;
- days since review;
- linked design problems and how many were practised (from the curriculum cross-links);
- interview-session confidence and debrief notes;
- the user's notes.

The signals are revision, weakness, **not yet applied** (studied but no linked problem practised), recency, roadmap importance and trend.

The actions are `review-concept` (two or more low ratings), `revise`, `apply` (do a design that uses it), `practice`, `interview` (designed but never interviewed) and `learn`.

### Daily plan (`buildCoachPlan`)
- **Time split:** 60/40 between DSA and SD when balanced (or 100/0).
- **Steps per action, for example:**
  - review the pattern (10 min);
  - solve Easy (15) / Medium (30) / Hard (45);
  - practise a variation;
  - explain the pattern (5);
  - SD steps: review → trade-offs → design exercise → explain → AI interview.
- **Fitting:** steps are added while they fit the time budget. The first steps are always kept.
- **Persistence:** plans are saved per day in `coach_plans`, so they don't reshuffle.
- **Completion:** a step counts as done automatically when the user logs practice for its problem or item that day; otherwise it's ticked by hand (`daily[date]["coach:<step>"]`).

## 3. AI layer (`lib/ai/`)

| File | Purpose |
|---|---|
| `types.ts` | `ChatModel` (`stream`, `health`), `EmbeddingModel` (`embed`) |
| `providers/ollama.ts` | Local models via Ollama's native API (streaming, `think: false`, `num_ctx`) |
| `providers/openai-compatible.ts` | Any OpenAI-compatible server hosting an open model (vLLM, llama.cpp, LM Studio, hosted inference) |
| `index.ts` | `chatModel()`, `embeddingModel()`, `AI_CONFIG` from env |

### Model choice

| | Gemma 4 E2B (QAT) — default | Gemma 4 E4B | Gemma 4 26B A4B / 31B |
|---|---|---|---|
| Download | 4.3 GB | 6.6 GB | 16–20 GB |
| Runs on an 8 GB laptop | ✅ alongside the app | ⚠️ tight | ❌ |
| Context | 128K (we use 8K) | 128K | 256K |
| Quality for coaching prose | good | better | best |
| Cost | free, local | free, local | GPU host |

Gemma's licence allows commercial use and modification.

**Why this choice:**
- **Gemma 4 E2B by default:** the project was developed on an 8 GB M1, and E2B leaves room for the browser and Next.js.
- **Coaching isn't reasoning-heavy:** the engine already does the analysis, so the model's job is grounded explanation and dialogue. A small model is enough.
- **Upgrading is a config change:** set `AI_MODEL=gemma4:e4b` on a bigger machine.
- **Hosting:** point `AI_PROVIDER=openai-compatible` and `AI_BASE_URL` at a server running Gemma (vLLM on a GPU host, or a hosted inference API).

Embeddings use **EmbeddingGemma** (308M parameters, 768 dimensions, about 600 MB), with its query/document task prefixes.

## 4. Retrieval (RAG)

- **Knowledge documents** (`lib/server/rag/knowledge.ts`): built from `data/` only. There are 649 documents in total:
  - DSA: topics, patterns (signals, idea, template, variations, mistakes, transfer, complexity, curated problems) and problems;
  - SD: concepts, HLD/LLD patterns and problems.

  Each document has `{ documentId, module, contentType, category, topic, pattern, difficulty, tags, title, href, content, hash }`.
- **Storage:** the `knowledge` collection, with `embedding`, `embedModel`, `createdAt` and `updatedAt`.
- **Indexing** (`indexer.ts`):
  - It's incremental: a document is re-embedded only when its hash or the embedding model changes. The first run embeds everything; later runs skip unchanged documents.
  - It creates or updates the Atlas Vector Search index `knowledge_vector`: a 768-d cosine vector, with filters on `module` and `contentType`.
  - Run it from the coach status chip ("Build knowledge base"), with `POST /api/coach/knowledge`, or with `npm run coach:index`.
- **Search** (`store.ts`):
  1. Atlas `$vectorSearch` filtered by module and content type.
  2. If that index isn't ready yet: in-process cosine similarity over the stored vectors.
  3. If no embedding model is reachable: keyword scoring over the same documents.

  The answer footer shows which method ran and which documents grounded it. `VectorStore` is the seam for another vector database.
- **Which documents each mode retrieves:**
  - Hints, explain and interview look up the exact pattern, concept or problem document by ID.
  - Ask and recognize use semantic search.

## 5. Coach features and API

| Page | What it does | Mode |
|---|---|---|
| `/coach` (Today's Plan) | Preferences (time, focus, difficulty, interview date, problems/day) → **Generate today's plan** → per-module focus, why, priority breakdown, timed steps, after-today pick, avoid-for-now, stop banner, and **Coach's take** (streamed explanation) | `plan` |
| `/coach/ask` → Ask | Chat grounded in profile facts plus the facts of any pattern or item the question names. Threads are saved privately. | `ask` |
| `/coach/ask` → Spot the pattern | Paste a problem → likely pattern(s), signals, why, questions to ask yourself. No solution. | `recognize` |
| `/coach/ask` → Hints | Four progressive levels: conceptual → pattern → approach → detailed. Revealed one at a time. | `hints` |
| `/coach/ask` → Explain it back | You explain a pattern or concept → feedback and a **Score N/5** → one click updates your pattern rating (DSA) or SD rating | `explain` |
| `/coach/interview` | DSA: problem → clarify → approach → follow-up → solution → evaluation → complexity → feedback. HLD/LLD: requirements → clarify → scale → API → architecture → data → scaling → failures → trade-offs → follow-ups → feedback. Recommended problems come from the engine. Results are saved with `logAttempt` (DSA) or `addSDSession` → `rateSD` (SD). | `interview` |
| `/coach/weak-areas` | Deterministic: ranked patterns or items with every metric and the priority breakdown, strong areas, and what's not started | — |

Endpoints (all require the session cookie and JSON bodies):
- `POST /api/coach/chat` takes `{ ctx, mode, date, threadId?, messages, ref? }` and streams plain text. The response headers `X-Coach-Model`, `X-Coach-Retrieval` and `X-Coach-Sources` describe the answer. The user's facts are recomputed from MongoDB on the server.
- `GET/POST /api/coach/plan` reads or generates the saved plan for a date.
- `GET /api/coach/status` returns model health and the knowledge index state.
- `POST /api/coach/knowledge` builds the knowledge index.
- `GET/DELETE /api/coach/threads` lists, reads or deletes saved conversations.

## 6. Feedback loop

Nothing is stored twice: the coach reads the same records the rest of the app writes.

- **Practice:** solving or reviewing on a problem page writes `history`, which changes success, recency, due dates and difficulty level tomorrow.
- **Interview mode:** its result goes through `logAttempt` (DSA) or `addSDSession` (SD), which updates history, ratings and the review schedule.
- **Explain it back:** its score updates the pattern self-rating (DSA) or calls `rateSD` (SD).
- **Repeated struggle:** raises weakness, which raises priority and triggers the stop rule.
- **Clean, confident attempts:** move the pattern to "level up" (harder or new variations), add it to "Avoid for now: no need for more reps", and drop it in priority.

## 7. Running it

```bash
brew install ollama            # or the installer from ollama.com
ollama serve                   # keep running
ollama pull gemma4:e2b-it-qat
ollama pull embeddinggemma
npm run dev                    # then open /coach → status chip → Build knowledge base
```

**Free hosted setup (used for the Vercel deployment):**
- **Chat:** Gemma 4 (`gemma-4-26b-a4b-it` or `gemma-4-31b-it`) on Google AI Studio's free tier, through the OpenAI-compatible connector. If the endpoint rejects system prompts, the connector folds the instructions into the first user message and remembers that for the model.
- **Embeddings:** EmbeddingGemma on Hugging Face Inference (`AI_EMBED_PROVIDER=huggingface`, `lib/ai/providers/huggingface.ts`).
- **Indexes don't mix:** Hugging Face returns full sentence-transformers vectors, while Ollama's EmbeddingGemma vectors differ (cosine ≈ 0.71 for the same text). Build the knowledge index with the same provider that answers queries. The indexer records `embedModel`, so switching provider shows "index needed" and a re-index replaces every vector.
- **Reasoning tags:** Google's Gemma 4 endpoint always reasons first and streams it inline as `<thought>…</thought>`; turning it off isn't supported for this model. The connector strips that block (`withoutThoughts`) and adds token headroom so the answer isn't cut short.
- **Variables:** see the commented block in `.env.example`.
- **Alternative:** `deploy/render-ollama/` plus `render.yaml` runs Ollama behind a key-checking Caddy proxy on a Render instance with 8 GB of RAM. The free tier is too small for it.

**Deploying to Vercel:**
- A Vercel deployment can't reach `localhost:11434`. Set `AI_PROVIDER=openai-compatible`, `AI_BASE_URL` and `AI_MODEL` to a hosted open-model endpoint.
- Without one, the deterministic parts (plan, weak areas, priorities) still work. The AI sections show the provider's error, and retrieval falls back to keywords.

## 8. Limitations

- Small local models can still phrase things loosely. The prompts forbid inventing user statistics and every fact is supplied, but answers are not formally checked against the data.
- DSA problem statements aren't stored (they belong to LeetCode). In interview mode the interviewer introduces the problem by title and asks the candidate to restate it.
- The "variation" of a problem is its curated takeaway. Custom problems count as their own variation.
- A plan explanation is generated once per plan. Regenerating the plan clears it.
- Conversations are capped at 80 messages per thread. Only the last 16 messages are sent to the model.

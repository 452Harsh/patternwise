# HLD (High-Level Design)

Part of the [System Design module](system-design.md). Track id: `"hld"`.

## Concepts: 54 in 7 categories (`data/sd/hld-concepts.ts`)

| Category id | Name |
|---|---|
| `core` | Core Distributed Systems |
| `infrastructure` | Infrastructure |
| `databases` | Databases |
| `caching` | Caching |
| `messaging` | Messaging |
| `reliability` | Reliability |
| `observability` | Observability |

Each `SDConcept` has the following fields:
- `summary` (what it is)
- `why` (why we use it)
- `whenToUse`
- `howItWorks` (ordered steps)
- an optional `flow` (a `FlowSpec` rendered by `components/sd/flow-diagram.tsx`)
- `pros` and `cons`
- `interviewQuestions`
- `related` (concept ids)

The page is `components/sd/concept-detail.tsx`, which includes `SDProgressPanel`.

## Architecture patterns: 16 (`data/sd/hld-patterns.ts`)

The 16 patterns are:
- **Caching:** Cache-Aside, Write-Through Cache, Write-Behind Cache
- **Messaging and events:** Pub/Sub, Event-Driven Architecture, CQRS, Event Sourcing
- **Data distribution:** Database Sharding, Read Replication, Consistent Hashing
- **Resilience:** Circuit Breaker, Retry with Backoff, Bulkhead, Saga, Rate Limiting
- **Concurrency:** Fan-out / Fan-in

Each `HLDPattern` has the following fields:
- `problem`
- `whenToUse` and `whenNotToUse`
- a `diagram` (`FlowSpec`)
- `advantages` and `disadvantages`
- `tradeoffs`
- linked `concepts` and `problems`

## Problems: 17 (`data/sd/hld-problems.ts`)

The 17 problems are:
- URL shortener
- Twitter
- Instagram
- YouTube
- Netflix
- WhatsApp
- Uber
- Google Drive
- Dropbox
- notification system
- rate limiter
- chat system
- ticket booking
- food delivery
- payment system
- search autocomplete
- news feed

Each `HLDProblem` has the following fields:
- `statement`
- `functional` and `nonFunctional` requirements
- `capacity` defaults (`CapacityDefaults`)
- hint `components`
- `deepDives`
- linked `concepts` and `patterns`

## HLD problem workspace (`components/sd/hld-workspace.tsx`)

The workspace is rendered by `sd-problem-page.tsx` and saved into `SDEntry.workspace` (`HLDWorkspaceData`). Its sections (`HLD_SECTIONS`) are:

1. **Requirements:** clarifying questions and scope, then functional and non-functional requirements.
2. **Capacity estimation:** a live calculator. You enter DAU, reads and writes per user per day, average object size, retention and peak factor. It derives read, write and peak RPS, the read:write ratio, new storage per day, total storage and ingress/egress bandwidth.
3. **API design:** a table of endpoint, method, request, response and auth.
4. **Data model:** a table of entity, fields and relationships, plus the database choice.
5. **Architecture:** links to or creates an architecture diagram (`createDiagram({ problemKey })`).
6. **Scaling and reliability prompts:** horizontal scaling, caching, database scaling, failure handling, failover, idempotency, disaster recovery and similar.
7. **Trade-offs:** a table of decision, alternative, reason and trade-off.
8. **Common deep dives:** reference hints, hidden by default.

The section editors (`WSection`, `StringList`, `RowsEditor`, `PromptField`, `Hints`) come from `components/sd/workspace-kit.tsx`. Reuse them for any new workspace section.

## Architecture editor (`components/sd/architecture-editor.tsx`)

The editor works on a `Diagram` of nodes (`ComponentType`: client, load balancer, API gateway, service, database, cache, queue, worker, CDN, storage, search, notification, DNS, external) and edges.

- **Editing:** drag from the palette (or click to place at a free spot), drag nodes, drag a handle to connect, double-click to rename, and use the inspector for label, type and note. Delete/Backspace removes the selection. You can zoom, and changes autosave through `updateDiagram`.
- **Layout:** uses container queries (`@container`, `@5xl:`), so it works full-page and embedded in a workspace.
- **Persistence:** stored in `sd_diagrams`. A diagram's review progress uses the key `diagram:<id>`.
- **Limitations:** see [`roadmap.md`](roadmap.md). There's no undo, no multi-select and no export, and edges are straight lines.

"use client";

import Link from "next/link";
import { Calculator, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, Tag } from "@/components/kit";
import { conceptById, hldPatternById } from "@/data/sd";
import type { CapacityDefaults, HLDProblem } from "@/data/sd/types";
import { blankSD, createDiagram, updateSD, useStore } from "@/lib/progress";
import { ArchitectureEditor } from "./architecture-editor";
import { Hints, PromptField, RowsEditor, StringList, WSection, rid } from "./workspace-kit";

export interface ApiRow {
  id: string;
  method: string;
  endpoint: string;
  request: string;
  response: string;
  auth: string;
}
export interface EntityRow {
  id: string;
  name: string;
  fields: string;
  relationships: string;
}
export interface TradeoffRow {
  id: string;
  decision: string;
  alternative: string;
  reason: string;
  tradeoff: string;
}

export interface HLDWorkspaceData {
  statement: string;
  functional: string[];
  nonFunctional: string[];
  capacity: CapacityDefaults;
  apis: ApiRow[];
  entities: EntityRow[];
  database: string;
  indexes: string;
  partitioning: string;
  diagramId?: string;
  scaling: Record<"horizontal" | "caching" | "database" | "partitioning" | "replication", string>;
  reliability: Record<"failures" | "retries" | "failover" | "idempotency" | "dr", string>;
  tradeoffs: TradeoffRow[];
  deepDive: string;
}

export const HLD_SECTIONS = [
  ["problem", "Problem"],
  ["requirements", "Requirements"],
  ["capacity", "Capacity"],
  ["api", "API design"],
  ["data", "Data model"],
  ["architecture", "Architecture"],
  ["scaling", "Scaling"],
  ["reliability", "Reliability"],
  ["tradeoffs", "Trade-offs"],
  ["deep-dive", "Deep dive"],
] as const;

const DEFAULT_CAPACITY: CapacityDefaults = { dau: 1_000_000, readsPerUser: 10, writesPerUser: 1, objectSizeKB: 1, retentionYears: 5, peakFactor: 3 };

export function hldDefaults(problem?: HLDProblem): HLDWorkspaceData {
  return {
    statement: "",
    functional: [],
    nonFunctional: [],
    capacity: problem?.capacity ?? DEFAULT_CAPACITY,
    apis: [],
    entities: [],
    database: "",
    indexes: "",
    partitioning: "",
    scaling: { horizontal: "", caching: "", database: "", partitioning: "", replication: "" },
    reliability: { failures: "", retries: "", failover: "", idempotency: "", dr: "" },
    tradeoffs: [],
    deepDive: "",
  };
}

/* ---------- capacity maths ---------- */

const SECONDS_PER_DAY = 86_400;

function human(n: number, unit = ""): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const fmt = (v: number, s: string) => `${v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(1) : v.toFixed(2)}${s}${unit}`;
  if (abs >= 1e12) return fmt(n / 1e12, "T");
  if (abs >= 1e9) return fmt(n / 1e9, "B");
  if (abs >= 1e6) return fmt(n / 1e6, "M");
  if (abs >= 1e3) return fmt(n / 1e3, "K");
  return fmt(n, "");
}

function bytes(kb: number): string {
  const units = ["KB", "MB", "GB", "TB", "PB", "EB"];
  let v = kb;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

export function capacityMath(c: CapacityDefaults) {
  const readQps = (c.dau * c.readsPerUser) / SECONDS_PER_DAY;
  const writeQps = (c.dau * c.writesPerUser) / SECONDS_PER_DAY;
  const totalQps = readQps + writeQps;
  const storagePerDayKB = c.dau * c.writesPerUser * c.objectSizeKB;
  return {
    readQps,
    writeQps,
    peakQps: totalQps * c.peakFactor,
    ratio: c.writesPerUser ? c.readsPerUser / c.writesPerUser : Infinity,
    storagePerDayKB,
    storageTotalKB: storagePerDayKB * 365 * c.retentionYears,
    ingressKBps: writeQps * c.objectSizeKB,
    egressKBps: readQps * c.objectSizeKB,
  };
}

function CapacityCalculator({ value, onChange, hint }: { value: CapacityDefaults; onChange: (c: CapacityDefaults) => void; hint?: CapacityDefaults }) {
  const m = capacityMath(value);
  const fields: { key: keyof CapacityDefaults; label: string; step?: number }[] = [
    { key: "dau", label: "Daily active users" },
    { key: "readsPerUser", label: "Reads / user / day" },
    { key: "writesPerUser", label: "Writes / user / day" },
    { key: "objectSizeKB", label: "Avg object size (KB)", step: 0.1 },
    { key: "retentionYears", label: "Retention (years)" },
    { key: "peakFactor", label: "Peak factor (× avg)", step: 0.5 },
  ];
  const results = [
    { label: "Read requests / sec", value: human(m.readQps) },
    { label: "Write requests / sec", value: human(m.writeQps) },
    { label: "Peak requests / sec", value: human(m.peakQps) },
    { label: "Read : write ratio", value: Number.isFinite(m.ratio) ? `${human(m.ratio)} : 1` : "read-only" },
    { label: "New storage / day", value: bytes(m.storagePerDayKB) },
    { label: `Storage over ${value.retentionYears}y`, value: bytes(m.storageTotalKB) },
    { label: "Ingress bandwidth", value: `${bytes(m.ingressKBps)}/s` },
    { label: "Egress bandwidth", value: `${bytes(m.egressKBps)}/s` },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-[11px] text-muted-foreground">{f.label}</span>
            <Input
              type="number"
              min={0}
              step={f.step ?? 1}
              value={value[f.key]}
              onChange={(e) => onChange({ ...value, [f.key]: Math.max(0, Number(e.target.value) || 0) })}
              className="font-mono"
            />
          </label>
        ))}
        {hint && (
          <Button variant="ghost" size="sm" className="col-span-2 justify-self-start text-muted-foreground" onClick={() => onChange(hint)}>
            Reset to the suggested assumptions
          </Button>
        )}
      </div>
      <Panel className="p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Calculator className="size-3.5" aria-hidden /> Back-of-the-envelope
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {results.map((r) => (
            <div key={r.label}>
              <dt className="text-[11px] text-muted-foreground">{r.label}</dt>
              <dd className="font-mono text-base font-semibold tabular-nums">{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[11px] text-muted-foreground">86,400 s/day · 1 KB = 1,024 B. State assumptions out loud in the interview.</p>
      </Panel>
    </div>
  );
}

/* ---------- workspace ---------- */

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const AUTH = ["None", "Session / JWT", "OAuth 2.0", "API key", "mTLS"];

export function HLDWorkspace({ itemKey, title, problem, customStatement }: { itemKey: string; title: string; problem?: HLDProblem; customStatement?: string }) {
  const entry = useStore().sd[itemKey] ?? blankSD();
  const ws: HLDWorkspaceData = { ...hldDefaults(problem), ...(entry.workspace as Partial<HLDWorkspaceData> | undefined) };
  const set = (patch: Partial<HLDWorkspaceData>) => updateSD(itemKey, { workspace: { ...ws, ...patch } as unknown as Record<string, unknown> }, title);

  return (
    <div className="space-y-10">
      <WSection id="problem" title="Problem" step={1}>
        <Panel className="space-y-3 p-4">
          <p className="text-sm leading-relaxed">{problem?.statement ?? customStatement}</p>
          <PromptField
            label="Clarifying questions & scope"
            value={ws.statement}
            onChange={(v) => set({ statement: v })}
            placeholder="What's in scope? Who are the users? Which features can be cut? Global or single region?"
          />
        </Panel>
      </WSection>

      <WSection id="requirements" title="Requirements" step={2} hint="Agree these with the interviewer before designing anything.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-4">
            <p className="mb-2 text-xs font-medium">Functional</p>
            <StringList items={ws.functional} onChange={(v) => set({ functional: v })} placeholder="Users can …" label="Functional requirements" />
          </Panel>
          <Panel className="p-4">
            <p className="mb-2 text-xs font-medium">Non-functional</p>
            <StringList items={ws.nonFunctional} onChange={(v) => set({ nonFunctional: v })} placeholder="p99 latency < …, 99.9% availability…" label="Non-functional requirements" />
          </Panel>
        </div>
        {problem && (
          <div className="mt-3">
            <Hints label="Typical requirements">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Functional</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {problem.functional.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Non-functional</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {problem.nonFunctional.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => set({ functional: [...new Set([...ws.functional, ...problem.functional])], nonFunctional: [...new Set([...ws.nonFunctional, ...problem.nonFunctional])] })}
              >
                Copy into my requirements
              </Button>
            </Hints>
          </div>
        )}
      </WSection>

      <WSection id="capacity" title="Capacity estimation" step={3} hint="Change the assumptions; the numbers update live.">
        <CapacityCalculator value={ws.capacity} onChange={(c) => set({ capacity: c })} hint={problem?.capacity} />
      </WSection>

      <WSection id="api" title="API design" step={4}>
        <RowsEditor<ApiRow>
          rows={ws.apis}
          onChange={(apis) => set({ apis })}
          blank={() => ({ id: rid(), method: "GET", endpoint: "", request: "", response: "", auth: "Session / JWT" })}
          addLabel="Add endpoint"
          emptyText="No endpoints yet. Start with the core read and write paths."
          columns={[
            { key: "method", label: "Method", kind: METHODS, width: "92px" },
            { key: "endpoint", label: "Endpoint", placeholder: "/v1/urls/{code}", mono: true, width: "1.2fr" },
            { key: "request", label: "Request", placeholder: "{ longUrl, alias? }", kind: "area", mono: true },
            { key: "response", label: "Response", placeholder: "201 { code, shortUrl }", kind: "area", mono: true },
            { key: "auth", label: "Auth", kind: AUTH, width: "130px" },
          ]}
        />
      </WSection>

      <WSection id="data" title="Data model" step={5}>
        <RowsEditor<EntityRow>
          rows={ws.entities}
          onChange={(entities) => set({ entities })}
          blank={() => ({ id: rid(), name: "", fields: "", relationships: "" })}
          addLabel="Add entity"
          emptyText="Define the core entities and their fields."
          columns={[
            { key: "name", label: "Entity", placeholder: "Url", width: "160px" },
            { key: "fields", label: "Fields", placeholder: "code PK, long_url, owner_id, created_at, expires_at", kind: "area", mono: true, width: "1.6fr" },
            { key: "relationships", label: "Relationships", placeholder: "owner_id → User (N:1)", kind: "area" },
          ]}
        />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Database choice</span>
            <Input list="db-options" value={ws.database} onChange={(e) => set({ database: e.target.value })} placeholder="e.g. Wide-column (Cassandra-style)" />
            <datalist id="db-options">
              {["Relational (PostgreSQL / MySQL)", "Wide-column (Cassandra-style)", "Key-value (DynamoDB / Redis-style)", "Document (MongoDB-style)", "Search index (Elasticsearch-style)", "Graph database", "Object storage + metadata DB", "Time-series database"].map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </label>
          <PromptField label="Indexes" value={ws.indexes} onChange={(v) => set({ indexes: v })} placeholder="Which queries need which indexes?" rows={2} />
          <PromptField label="Partitioning" value={ws.partitioning} onChange={(v) => set({ partitioning: v })} placeholder="Shard key, hot-key risks, re-sharding" rows={2} />
        </div>
      </WSection>

      <WSection id="architecture" title="Architecture" step={6} hint="Drag components, connect them, label the flows.">
        {ws.diagramId ? (
          <>
            <ArchitectureEditor diagramId={ws.diagramId} height={480} />
            <Link href={`/system-design/architecture/${ws.diagramId}`} className="mt-2 inline-block text-xs text-muted-foreground hover:text-foreground">
              Open full-screen editor →
            </Link>
          </>
        ) : (
          <Panel className="flex flex-col items-center gap-3 border-dashed px-6 py-10 text-center">
            <Workflow className="size-6 text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Sketch the high-level architecture: clients, edge, services, data stores and async flows.</p>
            <Button onClick={() => set({ diagramId: createDiagram({ title: `${title} — architecture`, problemKey: itemKey }) })}>Create architecture diagram</Button>
          </Panel>
        )}
      </WSection>

      <WSection id="scaling" title="Scaling" step={7}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <PromptField label="Horizontal scaling" value={ws.scaling.horizontal} onChange={(v) => set({ scaling: { ...ws.scaling, horizontal: v } })} placeholder="Which tiers are stateless? How do they scale out?" />
          <PromptField label="Caching" value={ws.scaling.caching} onChange={(v) => set({ scaling: { ...ws.scaling, caching: v } })} placeholder="What's cached where (CDN, app cache)? Hit ratio? Invalidation?" />
          <PromptField label="Database scaling" value={ws.scaling.database} onChange={(v) => set({ scaling: { ...ws.scaling, database: v } })} placeholder="Read replicas, write throughput limits, connection pooling" />
          <PromptField label="Partitioning" value={ws.scaling.partitioning} onChange={(v) => set({ scaling: { ...ws.scaling, partitioning: v } })} placeholder="Shard key and how traffic spreads; hot partitions" />
          <PromptField label="Replication" value={ws.scaling.replication} onChange={(v) => set({ scaling: { ...ws.scaling, replication: v } })} placeholder="Sync vs async, multi-region, consistency implications" />
        </div>
      </WSection>

      <WSection id="reliability" title="Reliability" step={8}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <PromptField label="Failure handling" value={ws.reliability.failures} onChange={(v) => set({ reliability: { ...ws.reliability, failures: v } })} placeholder="What fails, and what does the user see?" />
          <PromptField label="Retries" value={ws.reliability.retries} onChange={(v) => set({ reliability: { ...ws.reliability, retries: v } })} placeholder="Which calls retry? Backoff + jitter? Limits?" />
          <PromptField label="Failover" value={ws.reliability.failover} onChange={(v) => set({ reliability: { ...ws.reliability, failover: v } })} placeholder="Leader election, health checks, region failover" />
          <PromptField label="Idempotency" value={ws.reliability.idempotency} onChange={(v) => set({ reliability: { ...ws.reliability, idempotency: v } })} placeholder="Idempotency keys, dedupe on consumers" />
          <PromptField label="Disaster recovery" value={ws.reliability.dr} onChange={(v) => set({ reliability: { ...ws.reliability, dr: v } })} placeholder="Backups, RPO / RTO targets, restore drills" />
        </div>
      </WSection>

      <WSection id="tradeoffs" title="Trade-offs" step={9} hint="Every decision has a cost. Name it before the interviewer does.">
        <RowsEditor<TradeoffRow>
          rows={ws.tradeoffs}
          onChange={(tradeoffs) => set({ tradeoffs })}
          blank={() => ({ id: rid(), decision: "", alternative: "", reason: "", tradeoff: "" })}
          addLabel="Add decision"
          emptyText="Record key decisions, e.g. NoSQL over SQL for the URL table."
          columns={[
            { key: "decision", label: "Decision", placeholder: "Wide-column store for URLs", kind: "area" },
            { key: "alternative", label: "Alternative", placeholder: "Relational DB", kind: "area" },
            { key: "reason", label: "Reason", placeholder: "Simple key lookups at huge scale", kind: "area" },
            { key: "tradeoff", label: "Trade-off", placeholder: "No joins; eventual consistency", kind: "area" },
          ]}
        />
      </WSection>

      <WSection id="deep-dive" title="Deep dive" step={10}>
        <PromptField label="Pick one component and go deep" value={ws.deepDive} onChange={(v) => set({ deepDive: v })} placeholder="e.g. ID generation: base62 of a counter vs hash; collisions; key range allocation per node…" rows={5} />
        {problem && (
          <div className="mt-3">
            <Hints label="Hints: components, deep dives, related concepts">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Building blocks a strong answer usually touches</p>
                <div className="flex flex-wrap gap-1.5">
                  {problem.components.map((x) => (
                    <Tag key={x}>{x}</Tag>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Common deep dives</p>
                <ul className="list-disc space-y-1 pl-5">
                  {problem.deepDives.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Concepts:</span>
                {problem.concepts.map((id) => (
                  <Link key={id} href={`/system-design/concepts/${id}`} className="hover:underline">
                    <Tag>{conceptById.get(id)?.name ?? id}</Tag>
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Patterns:</span>
                {problem.patterns.map((id) => (
                  <Link key={id} href={`/system-design/patterns/${id}`} className="hover:underline">
                    <Tag>{hldPatternById.get(id)?.name ?? id}</Tag>
                  </Link>
                ))}
              </div>
            </Hints>
          </div>
        )}
      </WSection>
    </div>
  );
}

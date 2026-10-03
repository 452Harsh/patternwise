"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CodeBlock } from "@/components/code-block";
import { Panel, Tag } from "@/components/kit";
import { NativeSelect } from "@/components/native-select";
import { LLD_PATTERNS, conceptById, lldPatternById } from "@/data/sd";
import type { LLDProblem, UMLClass, UMLRelation, UMLSpec } from "@/data/sd/types";
import { blankSD, updateSD, useStore } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { UMLDiagram, UMLLegend, type Positions } from "./uml-diagram";
import { Hints, PromptField, RowsEditor, StringList, WSection, rid } from "./workspace-kit";

export interface UseCaseRow {
  id: string;
  actor: string;
  action: string;
}
export interface ClassRow {
  id: string;
  name: string;
  kind: "class" | "abstract";
  attributes: string;
  methods: string;
}
export interface InterfaceRow {
  id: string;
  name: string;
  methods: string;
}
export interface RelationRow {
  id: string;
  from: string;
  to: string;
  type: UMLRelation;
}

export type CodeLang = "java" | "cpp" | "python" | "typescript";

export interface LLDWorkspaceData {
  statement: string;
  functional: string[];
  actors: string[];
  useCases: UseCaseRow[];
  classes: ClassRow[];
  interfaces: InterfaceRow[];
  relationships: RelationRow[];
  patterns: string[];
  umlLayout: Positions;
  language: CodeLang;
  code: Partial<Record<CodeLang, string>>;
  review: Record<string, boolean>;
  reviewNotes: string;
}

export const LLD_SECTIONS = [
  ["requirements", "Requirements"],
  ["actors", "Actors"],
  ["use-cases", "Use cases"],
  ["classes", "Classes"],
  ["interfaces", "Interfaces"],
  ["relationships", "Relationships"],
  ["patterns", "Design patterns"],
  ["uml", "UML diagram"],
  ["code", "Code"],
  ["review", "Design review"],
] as const;

export const lldDefaults = (): LLDWorkspaceData => ({
  statement: "",
  functional: [],
  actors: [],
  useCases: [],
  classes: [],
  interfaces: [],
  relationships: [],
  patterns: [],
  umlLayout: {},
  language: "java",
  code: {},
  review: {},
  reviewNotes: "",
});

const LANGS: { value: CodeLang; label: string }[] = [
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "python", label: "Python" },
  { value: "typescript", label: "TypeScript" },
];

const RELATIONS: UMLRelation[] = ["inheritance", "realization", "composition", "aggregation", "association", "dependency"];

export const REVIEW_CHECKLIST: { id: string; group: string; text: string }[] = [
  { id: "srp", group: "SOLID", text: "Single responsibility: each class has one reason to change" },
  { id: "ocp", group: "SOLID", text: "Open/closed: new behaviour plugs in without editing existing classes" },
  { id: "lsp", group: "SOLID", text: "Liskov: every subtype can stand in for its base type" },
  { id: "isp", group: "SOLID", text: "Interface segregation: no client depends on methods it doesn't use" },
  { id: "dip", group: "SOLID", text: "Dependency inversion: high-level policy depends on abstractions" },
  { id: "coupling", group: "Structure", text: "Low coupling: classes know as little about each other as possible" },
  { id: "cohesion", group: "Structure", text: "High cohesion: each class's fields and methods belong together" },
  { id: "extensibility", group: "Structure", text: "Extensibility: the likely follow-up requirements fit without a rewrite" },
  { id: "composition", group: "Structure", text: "Composition over inheritance where behaviour varies at runtime" },
  { id: "interfaces", group: "Structure", text: "Interfaces describe capabilities, not implementations" },
  { id: "responsibility", group: "Structure", text: "Responsibilities separated: domain, orchestration, persistence, I/O" },
  { id: "patterns", group: "Patterns", text: "Patterns solve a real problem here — none forced in for show" },
];

const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

/** Build a UML spec from the workspace's classes, interfaces and relationships. */
export function toUML(ws: LLDWorkspaceData): UMLSpec {
  const classes: UMLClass[] = [
    ...ws.interfaces.filter((i) => i.name.trim()).map((i) => ({ name: i.name.trim(), kind: "interface" as const, attributes: [], methods: lines(i.methods) })),
    ...ws.classes.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), kind: c.kind, attributes: lines(c.attributes), methods: lines(c.methods) })),
  ];
  const names = new Set(classes.map((c) => c.name));
  return {
    classes,
    relations: ws.relationships.filter((r) => names.has(r.from) && names.has(r.to) && r.from !== r.to).map((r) => ({ from: r.from, to: r.to, type: r.type })),
  };
}

export function LLDWorkspace({ itemKey, title, problem, customStatement }: { itemKey: string; title: string; problem?: LLDProblem; customStatement?: string }) {
  const entry = useStore().sd[itemKey] ?? blankSD();
  const ws: LLDWorkspaceData = { ...lldDefaults(), ...(entry.workspace as Partial<LLDWorkspaceData> | undefined) };
  const set = (patch: Partial<LLDWorkspaceData>) => updateSD(itemKey, { workspace: { ...ws, ...patch } as unknown as Record<string, unknown> }, title);
  const [editCode, setEditCode] = useState(!ws.code[ws.language]);
  const spec = toUML(ws);
  const typeNames = spec.classes.map((c) => c.name);
  const code = ws.code[ws.language] ?? "";
  const reviewed = REVIEW_CHECKLIST.filter((c) => ws.review[c.id]).length;

  return (
    <div className="space-y-10">
      <WSection id="requirements" title="Requirements" step={1}>
        <Panel className="space-y-4 p-4">
          <p className="text-sm leading-relaxed">{problem?.statement ?? customStatement}</p>
          <StringList items={ws.functional} onChange={(v) => set({ functional: v })} placeholder="The system should …" label="Functional requirements" />
          <PromptField label="Assumptions & scope" value={ws.statement} onChange={(v) => set({ statement: v })} placeholder="Single building? Concurrency? Persistence in scope?" rows={2} />
        </Panel>
        {problem && (
          <div className="mt-3">
            <Hints label="Typical requirements & follow-ups">
              <ul className="list-disc space-y-1 pl-5">
                {problem.functional.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Follow-ups an interviewer may add</p>
                <ul className="list-disc space-y-1 pl-5">
                  {problem.extensions.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <Button variant="outline" size="sm" onClick={() => set({ functional: [...new Set([...ws.functional, ...problem.functional])] })}>
                Copy requirements
              </Button>
            </Hints>
          </div>
        )}
      </WSection>

      <WSection id="actors" title="Actors" step={2} hint="Who interacts with the system?">
        <Panel className="p-4">
          <StringList items={ws.actors} onChange={(v) => set({ actors: v })} placeholder="e.g. Customer, Admin, Payment gateway" label="Actors" />
          {problem && ws.actors.length === 0 && (
            <button type="button" className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline" onClick={() => set({ actors: problem.actors })}>
              Use suggested actors
            </button>
          )}
        </Panel>
      </WSection>

      <WSection id="use-cases" title="Use cases" step={3} hint="Actor → action.">
        <RowsEditor<UseCaseRow>
          rows={ws.useCases}
          onChange={(useCases) => set({ useCases })}
          blank={() => ({ id: rid(), actor: ws.actors[0] ?? "", action: "" })}
          addLabel="Add use case"
          emptyText="List what each actor does."
          columns={[
            { key: "actor", label: "Actor", kind: ws.actors.length ? ["", ...ws.actors] : "text", width: "200px", placeholder: "Customer" },
            { key: "action", label: "Action", placeholder: "Parks a vehicle and receives a ticket" },
          ]}
        />
      </WSection>

      <WSection id="classes" title="Classes" step={4} hint="One attribute or method per line, UML-style: “- spots: List<Spot>”, “+ park(v): Ticket”.">
        <RowsEditor<ClassRow>
          rows={ws.classes}
          onChange={(classes) => set({ classes })}
          blank={() => ({ id: rid(), name: "", kind: "class", attributes: "", methods: "" })}
          addLabel="Add class"
          emptyText="Add the core classes."
          columns={[
            { key: "name", label: "Class", placeholder: "ParkingLot", width: "170px" },
            { key: "kind", label: "Kind", kind: ["class", "abstract"], width: "110px" },
            { key: "attributes", label: "Attributes", placeholder: "- floors: List<Floor>", kind: "area", mono: true },
            { key: "methods", label: "Methods", placeholder: "+ park(v: Vehicle): Ticket", kind: "area", mono: true },
          ]}
        />
        {problem && (
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            Candidate entities:
            {problem.entities.map((x) => (
              <Tag key={x}>{x}</Tag>
            ))}
          </p>
        )}
      </WSection>

      <WSection id="interfaces" title="Interfaces" step={5}>
        <RowsEditor<InterfaceRow>
          rows={ws.interfaces}
          onChange={(interfaces) => set({ interfaces })}
          blank={() => ({ id: rid(), name: "", methods: "" })}
          addLabel="Add interface"
          emptyText="Define the abstractions your classes depend on."
          columns={[
            { key: "name", label: "Interface", placeholder: "PricingStrategy", width: "200px" },
            { key: "methods", label: "Methods", placeholder: "+ price(ticket: Ticket): Money", kind: "area", mono: true },
          ]}
        />
      </WSection>

      <WSection id="relationships" title="Relationships" step={6} hint="Read as “A relation B”: Car inheritance Vehicle; ParkingLot composition Floor.">
        <RowsEditor<RelationRow>
          rows={ws.relationships}
          onChange={(relationships) => set({ relationships })}
          blank={() => ({ id: rid(), from: typeNames[0] ?? "", to: typeNames[1] ?? "", type: "association" })}
          addLabel="Add relationship"
          emptyText={typeNames.length < 2 ? "Add at least two classes or interfaces first." : "Connect your classes."}
          columns={[
            { key: "from", label: "From (A)", kind: typeNames.length ? typeNames : "text" },
            { key: "type", label: "Relationship", kind: RELATIONS, width: "150px" },
            { key: "to", label: "To (B)", kind: typeNames.length ? typeNames : "text" },
          ]}
        />
      </WSection>

      <WSection id="patterns" title="Design patterns" step={7} hint="Attach the patterns your solution uses.">
        <div className="flex flex-wrap gap-1.5">
          {ws.patterns.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 py-1 pr-1 pl-2.5 text-sm">
              <Link href={`/system-design/patterns/${id}`} className="hover:underline">
                {lldPatternById.get(id)?.name ?? id}
              </Link>
              <button type="button" aria-label={`Detach ${lldPatternById.get(id)?.name}`} onClick={() => set({ patterns: ws.patterns.filter((p) => p !== id) })} className="grid size-5 place-items-center rounded-md hover:bg-muted">
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
          <NativeSelect
            aria-label="Attach a pattern"
            value=""
            onChange={(e) => e.target.value && set({ patterns: [...ws.patterns, e.target.value] })}
          >
            <option value="">+ Attach pattern…</option>
            {(["creational", "structural", "behavioral"] as const).map((fam) => (
              <optgroup key={fam} label={fam[0].toUpperCase() + fam.slice(1)}>
                {LLD_PATTERNS.filter((p) => p.category === fam && !ws.patterns.includes(p.id)).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </NativeSelect>
        </div>
        {problem && (
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            Often a good fit:
            {problem.patterns.map((id) => (
              <button
                key={id}
                type="button"
                disabled={ws.patterns.includes(id)}
                onClick={() => set({ patterns: [...ws.patterns, id] })}
                className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 hover:bg-muted disabled:opacity-50"
              >
                {ws.patterns.includes(id) ? <Check className="size-3" aria-hidden /> : <Plus className="size-3" aria-hidden />}
                {lldPatternById.get(id)?.name ?? id}
              </button>
            ))}
          </p>
        )}
      </WSection>

      <WSection id="uml" title="UML class diagram" step={8} hint="Generated from your classes, interfaces and relationships. Drag boxes to arrange; positions are saved.">
        {spec.classes.length ? (
          <>
            <UMLDiagram spec={spec} positions={ws.umlLayout} onMove={(name, x, y) => set({ umlLayout: { ...ws.umlLayout, [name]: { x, y } } })} className="max-h-[560px]" />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <details>
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">How to read the arrows</summary>
                <div className="mt-2">
                  <UMLLegend />
                </div>
              </details>
              <Button variant="ghost" size="sm" onClick={() => set({ umlLayout: {} })}>
                Reset layout
              </Button>
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Add classes above and the diagram appears here.</p>
        )}
      </WSection>

      <WSection id="code" title="Code" step={9}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg border p-0.5" role="tablist" aria-label="Language">
            {LANGS.map((l) => (
              <button
                key={l.value}
                type="button"
                role="tab"
                aria-selected={ws.language === l.value}
                onClick={() => {
                  set({ language: l.value });
                  setEditCode(!ws.code[l.value]);
                }}
                className={cn(
                  "h-7 rounded-md px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  ws.language === l.value ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
                {ws.code[l.value] ? <span className="ml-1.5 inline-block size-1.5 rounded-full bg-success align-middle" aria-label="has code" /> : null}
              </button>
            ))}
          </div>
          {code && (
            <Button variant="ghost" size="sm" onClick={() => setEditCode((v) => !v)}>
              {editCode ? "Preview" : "Edit"}
            </Button>
          )}
        </div>
        {editCode || !code ? (
          <Textarea
            value={code}
            onChange={(e) => set({ code: { ...ws.code, [ws.language]: e.target.value } })}
            rows={16}
            placeholder={`Write your ${LANGS.find((l) => l.value === ws.language)?.label} solution…`}
            className="resize-y bg-surface font-mono text-[13px] leading-relaxed"
            aria-label="Solution code"
            spellCheck={false}
          />
        ) : (
          <CodeBlock code={code} language={ws.language} />
        )}
      </WSection>

      <WSection id="review" title="Design review" step={10} hint="A self-review checklist, not a pass/fail verdict. Be honest; write down what you'd change.">
        <Panel className="divide-y">
          {REVIEW_CHECKLIST.map((c, i) => (
            <label key={c.id} className="flex cursor-pointer items-start gap-3 px-4 py-3">
              <Checkbox
                checked={!!ws.review[c.id]}
                onCheckedChange={(v) => set({ review: { ...ws.review, [c.id]: v === true } })}
                className="mt-0.5 data-checked:animate-pop data-checked:border-success data-checked:bg-success"
              />
              <span className="min-w-0 flex-1 text-sm">
                {(i === 0 || REVIEW_CHECKLIST[i - 1].group !== c.group) && (
                  <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{c.group}</span>
                )}
                {c.text}
              </span>
            </label>
          ))}
        </Panel>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {reviewed}/{REVIEW_CHECKLIST.length} checked
        </p>
        <div className="mt-3">
          <PromptField label="What I'd improve" value={ws.reviewNotes} onChange={(v) => set({ reviewNotes: v })} placeholder="Where is the design weakest? What breaks first under the follow-ups?" rows={4} />
        </div>
        {problem && (
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            Concepts to revisit:
            {problem.concepts.map((id) => (
              <Link key={id} href={`/system-design/concepts/${id}`} className="hover:underline">
                <Tag>{conceptById.get(id)?.name ?? id}</Tag>
              </Link>
            ))}
          </p>
        )}
      </WSection>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import type { UMLRelation, UMLSpec } from "@/data/sd/types";
import { cn } from "@/lib/utils";

const W = 228;
const HEADER = 34;
const LINE = 16;
const PAD = 16;
const GAP_X = 48;
const GAP_Y = 64;

export type Positions = Record<string, { x: number; y: number }>;

const boxHeight = (attrs: number, methods: number) => HEADER + Math.max(1, attrs) * LINE + Math.max(1, methods) * LINE + 18;

/** Parents (targets of inheritance/realization) above their children; everything else by first appearance. */
export function autoLayout(spec: UMLSpec): Positions {
  const names = spec.classes.map((c) => c.name);
  const level = new Map(names.map((n) => [n, 0]));
  for (let pass = 0; pass < names.length; pass++) {
    let changed = false;
    for (const r of spec.relations) {
      if (r.type !== "inheritance" && r.type !== "realization") continue;
      const want = (level.get(r.to) ?? 0) + 1;
      if ((level.get(r.from) ?? 0) < want) {
        level.set(r.from, want);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const rows = new Map<number, string[]>();
  for (const n of names) rows.set(level.get(n)!, [...(rows.get(level.get(n)!) ?? []), n]);
  const byName = new Map(spec.classes.map((c) => [c.name, c]));
  const out: Positions = {};
  let y = PAD;
  for (const lvl of [...rows.keys()].sort((a, b) => a - b)) {
    const row = rows.get(lvl)!;
    row.forEach((n, i) => (out[n] = { x: PAD + i * (W + GAP_X), y }));
    const tallest = Math.max(...row.map((n) => boxHeight(byName.get(n)!.attributes.length, byName.get(n)!.methods.length)));
    y += tallest + GAP_Y;
  }
  return out;
}

/** Point where the segment from the box centre towards (tx, ty) leaves the box. */
function edgePoint(box: { x: number; y: number; w: number; h: number }, tx: number, ty: number) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const sx = box.w / 2 / Math.abs(dx || 1e-9);
  const sy = box.h / 2 / Math.abs(dy || 1e-9);
  const s = Math.min(sx, sy);
  return { x: cx + dx * s, y: cy + dy * s };
}

const STYLE: Record<UMLRelation, { dashed?: boolean; end?: string; start?: string; label: string }> = {
  inheritance: { end: "uml-triangle", label: "inherits" },
  realization: { dashed: true, end: "uml-triangle", label: "implements" },
  composition: { start: "uml-diamond-filled", label: "composition" },
  aggregation: { start: "uml-diamond", label: "aggregation" },
  association: { end: "uml-arrow", label: "association" },
  dependency: { dashed: true, end: "uml-arrow", label: "uses" },
};

export const RELATION_HELP: Record<UMLRelation, string> = {
  inheritance: "A is-a B (A extends B)",
  realization: "A implements interface B",
  composition: "A owns B; B can't exist without A",
  aggregation: "A has B; B can exist on its own",
  association: "A knows about / uses B long-term",
  dependency: "A uses B temporarily (parameter, local)",
};

/**
 * UML class diagram. Relations read "from → to": for composition/aggregation `from` is the whole
 * (diamond drawn on its side); for inheritance/realization `from` is the subtype.
 * Pass `onMove` to make boxes draggable (positions are then controlled by the parent).
 */
export function UMLDiagram({
  spec,
  positions,
  onMove,
  className,
  label,
}: {
  spec: UMLSpec;
  positions?: Positions;
  onMove?: (name: string, x: number, y: number) => void;
  className?: string;
  label?: string;
}) {
  const auto = autoLayout(spec);
  const [drag, setDrag] = useState<{ name: string; dx: number; dy: number; x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const pos = (name: string) => (drag?.name === name ? { x: drag.x, y: drag.y } : (positions?.[name] ?? auto[name] ?? { x: PAD, y: PAD }));
  const boxes = new Map(
    spec.classes.map((c) => {
      const p = pos(c.name);
      return [c.name, { x: p.x, y: p.y, w: W, h: boxHeight(c.attributes.length, c.methods.length) }];
    }),
  );
  const width = Math.max(320, ...[...boxes.values()].map((b) => b.x + b.w + PAD));
  const height = Math.max(160, ...[...boxes.values()].map((b) => b.y + b.h + PAD));

  const onPointerDown = (name: string) => (e: React.PointerEvent) => {
    if (!onMove || !ref.current) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const rect = ref.current.getBoundingClientRect();
    const p = pos(name);
    setDrag({ name, dx: e.clientX - rect.left - p.x, dy: e.clientY - rect.top - p.y, x: p.x, y: p.y });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.round((e.clientX - rect.left - drag.dx) / 8) * 8);
    const y = Math.max(0, Math.round((e.clientY - rect.top - drag.dy) / 8) * 8);
    setDrag({ ...drag, x, y });
  };
  const onPointerUp = () => {
    if (drag && onMove) onMove(drag.name, drag.x, drag.y);
    setDrag(null);
  };

  const description =
    label ??
    `Class diagram: ${spec.classes.map((c) => c.name).join(", ")}. ${spec.relations.map((r) => `${r.from} ${STYLE[r.type].label} ${r.to}`).join("; ")}`;

  return (
    <div className={cn("sd-canvas overflow-auto rounded-xl border p-2", className)}>
      <div
        ref={ref}
        className="relative"
        style={{ width, height }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label={description}
      >
        <svg width={width} height={height} className="absolute inset-0" aria-hidden>
          <defs>
            <marker id="uml-triangle" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto">
              <path d="M1,1 L11,6 L1,11 z" className="fill-card stroke-muted-foreground" strokeWidth="1.2" />
            </marker>
            <marker id="uml-arrow" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto">
              <path d="M1,1 L11,6 L1,11" fill="none" className="stroke-muted-foreground" strokeWidth="1.4" />
            </marker>
            <marker id="uml-diamond" viewBox="0 0 16 10" refX="15" refY="5" markerWidth="16" markerHeight="10" orient="auto-start-reverse">
              <path d="M1,5 L8,1 L15,5 L8,9 z" className="fill-card stroke-muted-foreground" strokeWidth="1.2" />
            </marker>
            <marker id="uml-diamond-filled" viewBox="0 0 16 10" refX="15" refY="5" markerWidth="16" markerHeight="10" orient="auto-start-reverse">
              <path d="M1,5 L8,1 L15,5 L8,9 z" className="fill-muted-foreground stroke-muted-foreground" strokeWidth="1.2" />
            </marker>
          </defs>
          {spec.relations.map((r, i) => {
            const a = boxes.get(r.from);
            const b = boxes.get(r.to);
            if (!a || !b) return null;
            let p1 = edgePoint(a, b.x + b.w / 2, b.y + b.h / 2);
            let p2 = edgePoint(b, a.x + a.w / 2, a.y + a.h / 2);
            // Several relations between the same two classes: draw them as parallel lines.
            const pair = [r.from, r.to].sort().join("|");
            const siblings = spec.relations.filter((x) => [x.from, x.to].sort().join("|") === pair);
            if (siblings.length > 1) {
              const k = siblings.indexOf(r) - (siblings.length - 1) / 2;
              const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
              const ox = (-(p2.y - p1.y) / len) * k * 14;
              const oy = ((p2.x - p1.x) / len) * k * 14;
              p1 = { x: p1.x + ox, y: p1.y + oy };
              p2 = { x: p2.x + ox, y: p2.y + oy };
            }
            const st = STYLE[r.type];
            return (
              <g key={i}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  className="stroke-muted-foreground"
                  strokeWidth={1.3}
                  strokeDasharray={st.dashed ? "5 4" : undefined}
                  markerEnd={st.end ? `url(#${st.end})` : undefined}
                  markerStart={st.start ? `url(#${st.start})` : undefined}
                />
                {r.label && (
                  <text x={(p1.x + p2.x) / 2 + 4} y={(p1.y + p2.y) / 2 - 4} className="fill-muted-foreground font-mono text-[10px]">
                    {r.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {spec.classes.map((c) => {
          const b = boxes.get(c.name)!;
          return (
            <div
              key={c.name}
              className={cn(
                "absolute overflow-hidden rounded-lg border bg-card text-[11px] shadow-sm",
                drag?.name === c.name && "ring-2 ring-primary/60",
                c.kind === "interface" && "border-info/40",
              )}
              style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
            >
              <div
                onPointerDown={onPointerDown(c.name)}
                className={cn(
                  "flex flex-col items-center justify-center border-b bg-muted/60 px-2 text-center leading-tight",
                  onMove && "cursor-grab touch-none active:cursor-grabbing",
                )}
                style={{ height: HEADER }}
              >
                {c.kind !== "class" && (
                  <span className="font-mono text-[9px] text-muted-foreground">{c.kind === "interface" ? "«interface»" : "«abstract»"}</span>
                )}
                <span className={cn("truncate font-semibold", c.kind === "abstract" && "italic")}>{c.name}</span>
              </div>
              <ul className="border-b px-2 py-1 font-mono" style={{ minHeight: LINE + 8 }}>
                {c.attributes.map((a) => (
                  <li key={a} className="truncate leading-4" title={a}>
                    {a}
                  </li>
                ))}
              </ul>
              <ul className="px-2 py-1 font-mono">
                {c.methods.map((m) => (
                  <li key={m} className="truncate leading-4" title={m}>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function UMLLegend() {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
      {(Object.keys(RELATION_HELP) as UMLRelation[]).map((r) => (
        <li key={r}>
          <span className="font-medium text-foreground capitalize">{r}</span> — {RELATION_HELP[r]}
        </li>
      ))}
    </ul>
  );
}

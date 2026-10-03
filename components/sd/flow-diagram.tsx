import type { FlowSpec } from "@/data/sd/types";
import { cn } from "@/lib/utils";
import { componentMeta } from "./components";

const NODE_W = 132;
const NODE_H = 46;
const COL_GAP = 64;
const ROW_GAP = 22;
const PAD = 12;

/** Longest-path layering from sources, left to right. Cycles are broken by visit order. */
function layout(spec: FlowSpec) {
  const ids = spec.nodes.map((n) => n.id);
  const incoming = new Map(ids.map((id) => [id, 0]));
  for (const e of spec.edges) incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  const layer = new Map<string, number>();
  const queue = ids.filter((id) => !incoming.get(id));
  if (!queue.length && ids.length) queue.push(ids[0]);
  for (const id of queue) layer.set(id, 0);
  let guard = 0;
  while (queue.length && guard++ < 500) {
    const id = queue.shift()!;
    for (const e of spec.edges) {
      if (e.from !== id) continue;
      const next = (layer.get(id) ?? 0) + 1;
      if (!layer.has(e.to) || (layer.get(e.to)! < next && next < ids.length)) {
        layer.set(e.to, next);
        queue.push(e.to);
      }
    }
  }
  for (const id of ids) if (!layer.has(id)) layer.set(id, 0);

  const columns = new Map<number, string[]>();
  for (const id of ids) columns.set(layer.get(id)!, [...(columns.get(layer.get(id)!) ?? []), id]);
  const maxRows = Math.max(1, ...[...columns.values()].map((c) => c.length));
  const height = PAD * 2 + maxRows * NODE_H + (maxRows - 1) * ROW_GAP;
  const cols = Math.max(1, columns.size);
  const width = PAD * 2 + cols * NODE_W + (cols - 1) * COL_GAP;

  const pos = new Map<string, { x: number; y: number }>();
  for (const [col, list] of columns) {
    const colH = list.length * NODE_H + (list.length - 1) * ROW_GAP;
    const top = (height - colH) / 2;
    list.forEach((id, i) => pos.set(id, { x: PAD + col * (NODE_W + COL_GAP), y: top + i * (NODE_H + ROW_GAP) }));
  }
  return { pos, width, height };
}

/** Read-only, auto-laid-out flow diagram used on concept and pattern pages. */
export function FlowDiagram({ spec, className, label }: { spec: FlowSpec; className?: string; label?: string }) {
  const { pos, width, height } = layout(spec);
  const names = new Map(spec.nodes.map((n) => [n.id, n.label]));
  const description =
    label ?? `Diagram: ${spec.edges.map((e) => `${names.get(e.from)} to ${names.get(e.to)}${e.label ? ` (${e.label})` : ""}`).join("; ")}`;

  return (
    <div className={cn("sd-canvas overflow-x-auto rounded-xl border p-3", className)}>
      <div className="relative mx-auto" style={{ width, height }} role="img" aria-label={description}>
        <svg width={width} height={height} className="absolute inset-0 overflow-visible" aria-hidden>
          <defs>
            <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="fill-muted-foreground" />
            </marker>
          </defs>
          {spec.edges.map((e, i) => {
            const a = pos.get(e.from);
            const b = pos.get(e.to);
            if (!a || !b) return null;
            const forward = b.x > a.x;
            const x1 = forward ? a.x + NODE_W : a.x + NODE_W / 2;
            const y1 = forward ? a.y + NODE_H / 2 : a.y + NODE_H;
            const x2 = forward ? b.x : b.x + NODE_W / 2;
            const y2 = forward ? b.y + NODE_H / 2 : b.y + NODE_H;
            const d = forward
              ? `M${x1},${y1} C${x1 + COL_GAP / 2},${y1} ${x2 - COL_GAP / 2},${y2} ${x2},${y2}`
              : `M${x1},${y1} C${x1},${y1 + 40} ${x2},${y2 + 40} ${x2},${y2 + 2}`;
            return (
              <g key={i}>
                <path d={d} fill="none" className="stroke-muted-foreground/60" strokeWidth={1.5} markerEnd="url(#flow-arrow)" />
                {e.label && (
                  <text
                    x={(x1 + x2) / 2}
                    y={forward ? (y1 + y2) / 2 - 6 : Math.max(y1, y2) + 34}
                    textAnchor="middle"
                    className="fill-muted-foreground font-mono text-[10px]"
                  >
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {spec.nodes.map((n) => {
          const p = pos.get(n.id)!;
          const m = componentMeta(n.type);
          const Icon = m.icon;
          return (
            <div
              key={n.id}
              className="absolute flex items-center gap-2 rounded-lg border bg-card px-2.5 shadow-sm"
              style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H }}
            >
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-md", m.tone)}>
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className="line-clamp-2 text-[11.5px] leading-tight font-medium">{n.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

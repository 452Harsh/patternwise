"use client";

import { useRef, useState } from "react";
import {
  ArrowLeftRight,
  Link2,
  MessageSquareText,
  Minus,
  MousePointer2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { SyncIndicator } from "@/components/shell/sync-boot";
import {
  updateDiagram,
  useStore,
  type Diagram,
  type DiagramEdge,
  type DiagramNode,
} from "@/lib/progress";
import { cn } from "@/lib/utils";
import { COMPONENTS, componentMeta } from "./components";

const CANVAS_W = 2400;
const CANVAS_H = 1500;
const NODE_W = 152;
const NODE_H = 52;
const SNAP = 10;
const DND_TYPE = "application/x-patternwise-component";

const snap = (v: number) => Math.round(v / SNAP) * SNAP;
const newId = (p: string) =>
  `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

type Selection = { kind: "node" | "edge"; id: string } | null;

function edgePoint(n: { x: number; y: number }, tx: number, ty: number) {
  const cx = n.x + NODE_W / 2;
  const cy = n.y + NODE_H / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const s = Math.min(
    NODE_W / 2 / Math.abs(dx || 1e-9),
    NODE_H / 2 / Math.abs(dy || 1e-9),
  );
  return { x: cx + dx * s, y: cy + dy * s };
}

const GAP = 28;
const overlaps = (p: { x: number; y: number }, n: { x: number; y: number }) =>
  Math.abs(p.x - n.x) < NODE_W + GAP && Math.abs(p.y - n.y) < NODE_H + GAP;

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

/**
 * Nearest position to `start` (searching outward on a grid) that doesn't overlap an existing node,
 * preferring spots inside the visible part of the canvas.
 */
function freeSpot(
  start: { x: number; y: number },
  nodes: { x: number; y: number }[],
  visible: Bounds,
) {
  const stepX = NODE_W + GAP;
  const stepY = NODE_H + GAP;
  const inside = (p: { x: number; y: number }) =>
    p.x >= visible.minX &&
    p.y >= visible.minY &&
    p.x <= visible.maxX &&
    p.y <= visible.maxY;
  for (const requireVisible of [true, false]) {
    for (let ring = 0; ring < 12; ring++) {
      for (let dy = -ring; dy <= ring; dy++) {
        for (let dx = -ring; dx <= ring; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const p = {
            x: clamp(start.x + dx * stepX, 0, CANVAS_W - NODE_W),
            y: clamp(start.y + dy * stepY, 0, CANVAS_H - NODE_H),
          };
          if (requireVisible && !inside(p)) continue;
          if (!nodes.some((n) => overlaps(p, n))) return p;
        }
      }
    }
  }
  return start;
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

export function ArchitectureEditor({
  diagramId,
  height = 560,
}: {
  diagramId: string;
  height?: number;
}) {
  const diagram = useStore().diagrams[diagramId];
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<Selection>(null);
  const [drag, setDrag] = useState<{
    id: string;
    offX: number;
    offY: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const [wire, setWire] = useState<{
    from: string;
    x: number;
    y: number;
  } | null>(null);
  const [tapConnect, setTapConnect] = useState<{
    active: boolean;
    from?: string;
  }>({ active: false });

  const save = (patch: Partial<Diagram>) => updateDiagram(diagramId, patch);
  const nodes = diagram?.nodes ?? [];
  const edges = diagram?.edges ?? [];

  if (!diagram) return null;

  const toCanvas = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  };

  const addNode = (type: string, at?: { x: number; y: number }) => {
    const meta = componentMeta(type);
    let pos = at;
    if (!pos) {
      const el = scrollRef.current!;
      const center = {
        x: (el.scrollLeft + el.clientWidth / 2) / zoom - NODE_W / 2,
        y: (el.scrollTop + el.clientHeight / 2) / zoom - NODE_H / 2,
      };
      const visible = {
        minX: el.scrollLeft / zoom + 8,
        minY: el.scrollTop / zoom + 8,
        maxX: (el.scrollLeft + el.clientWidth) / zoom - NODE_W - 16,
        maxY: (el.scrollTop + el.clientHeight) / zoom - NODE_H - 16,
      };
      pos = freeSpot(center, nodes, visible);
    }
    const sameType = nodes.filter((n) => n.type === type).length;
    const node: DiagramNode = {
      id: newId("n"),
      type,
      label: sameType ? `${meta.label} ${sameType + 1}` : meta.label,
      x: clamp(snap(pos.x), 0, CANVAS_W - NODE_W),
      y: clamp(snap(pos.y), 0, CANVAS_H - NODE_H),
    };
    save({ nodes: [...nodes, node] });
    setSelected({ kind: "node", id: node.id });
  };

  const connect = (from: string, to: string) => {
    if (from === to || edges.some((e) => e.from === from && e.to === to))
      return;
    const edge: DiagramEdge = { id: newId("e"), from, to };
    save({ edges: [...edges, edge] });
    setSelected({ kind: "edge", id: edge.id });
  };

  function removeSelected() {
    if (!selected) return;
    if (selected.kind === "node") {
      save({
        nodes: nodes.filter((n) => n.id !== selected.id),
        edges: edges.filter(
          (e) => e.from !== selected.id && e.to !== selected.id,
        ),
      });
    } else {
      save({ edges: edges.filter((e) => e.id !== selected.id) });
    }
    setSelected(null);
  }

  /* ---- pointer interactions ---- */

  // Focus the canvas for keyboard shortcuts without letting the browser scroll it into view mid-drag.
  const focusCanvas = (e: React.PointerEvent) => {
    e.preventDefault();
    scrollRef.current?.focus({ preventScroll: true });
  };

  const onNodePointerDown = (n: DiagramNode) => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    focusCanvas(e);
    if (tapConnect.active) {
      if (!tapConnect.from) setTapConnect({ active: true, from: n.id });
      else {
        connect(tapConnect.from, n.id);
        setTapConnect({ active: true });
      }
      return;
    }
    const p = toCanvas(e.clientX, e.clientY);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelected({ kind: "node", id: n.id });
    setDrag({
      id: n.id,
      offX: p.x - n.x,
      offY: p.y - n.y,
      x: n.x,
      y: n.y,
      moved: false,
    });
  };

  const onHandlePointerDown = (n: DiagramNode) => (e: React.PointerEvent) => {
    e.stopPropagation();
    focusCanvas(e);
    const p = toCanvas(e.clientX, e.clientY);
    canvasRef.current!.setPointerCapture(e.pointerId);
    setWire({ from: n.id, x: p.x, y: p.y });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (drag) {
      const p = toCanvas(e.clientX, e.clientY);
      setDrag({
        ...drag,
        x: clamp(snap(p.x - drag.offX), 0, CANVAS_W - NODE_W),
        y: clamp(snap(p.y - drag.offY), 0, CANVAS_H - NODE_H),
        moved: true,
      });
    } else if (wire) {
      const p = toCanvas(e.clientX, e.clientY);
      setWire({ ...wire, x: p.x, y: p.y });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (drag) {
      if (drag.moved)
        save({
          nodes: nodes.map((n) =>
            n.id === drag.id ? { ...n, x: drag.x, y: drag.y } : n,
          ),
        });
      setDrag(null);
    } else if (wire) {
      const target = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-node-id]");
      if (target?.dataset.nodeId) connect(wire.from, target.dataset.nodeId);
      setWire(null);
    }
  };

  const posOf = (n: DiagramNode) =>
    drag?.id === n.id ? { x: drag.x, y: drag.y } : { x: n.x, y: n.y };
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const selNode = selected?.kind === "node" ? byId.get(selected.id) : undefined;
  const selEdge =
    selected?.kind === "edge"
      ? edges.find((e) => e.id === selected.id)
      : undefined;

  const patchNode = (id: string, patch: Partial<DiagramNode>) =>
    save({ nodes: nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) });
  const patchEdge = (id: string, patch: Partial<DiagramEdge>) =>
    save({ edges: edges.map((x) => (x.id === id ? { ...x, ...patch } : x)) });

  // Keyboard: Delete removes the selection, Escape cancels (while focus is inside the editor).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (isTyping(e.target)) return;
    if ((e.key === "Delete" || e.key === "Backspace") && selected) {
      e.preventDefault();
      removeSelected();
    } else if (e.key === "Escape") {
      setSelected(null);
      setWire(null);
      setTapConnect({ active: false });
    }
  };

  return (
    // Layout follows the editor's own width (container queries), so it also works embedded in a workspace.
    <div className="@container" onKeyDown={onKeyDown}>
      <div className="grid grid-cols-1 gap-3 @5xl:grid-cols-[180px_minmax(0,1fr)_240px]">
        {/* Palette */}
        <aside aria-label="Components">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Components
          </p>
          <ul className="grid grid-cols-2 gap-1.5 @md:grid-cols-4 @3xl:grid-cols-7 @5xl:grid-cols-1">
            {COMPONENTS.map((c) => {
              const Icon = c.icon;
              return (
                <li key={c.type}>
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(DND_TYPE, c.type);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => addNode(c.type)}
                    title={`Add ${c.label} (or drag onto the canvas)`}
                    className="flex w-full cursor-grab items-center gap-2 rounded-lg border bg-card px-2 py-1.5 text-left text-xs outline-none transition-colors hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-md",
                        c.tone,
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="truncate">{c.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Canvas */}
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <div
              className="flex items-center rounded-lg border"
              role="group"
              aria-label="Zoom"
            >
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Zoom out"
                onClick={() =>
                  setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))
                }
              >
                <Minus />
              </Button>
              <span className="w-11 text-center font-mono text-xs tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Zoom in"
                onClick={() =>
                  setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))
                }
              >
                <Plus />
              </Button>
            </div>
            <Button
              variant={tapConnect.active ? "default" : "outline"}
              size="sm"
              onClick={() => setTapConnect((t) => ({ active: !t.active }))}
              aria-pressed={tapConnect.active}
              title="Tap a source, then a target (handy on touch screens). Or drag from a node's right-hand dot."
            >
              {tapConnect.active ? (
                <Link2 data-icon="inline-start" />
              ) : (
                <MousePointer2 data-icon="inline-start" />
              )}
              {tapConnect.active
                ? tapConnect.from
                  ? "Pick target…"
                  : "Pick source…"
                : "Connect mode"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={removeSelected}
              disabled={!selected}
            >
              <Trash2 data-icon="inline-start" /> Delete
            </Button>
            <span className="ml-auto">
              <SyncIndicator />
            </span>
          </div>

          <div
            ref={scrollRef}
            tabIndex={0}
            className="overflow-auto rounded-xl border outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ height }}
          >
            <div style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom }}>
              <div
                ref={canvasRef}
                className="sd-canvas relative origin-top-left select-none"
                style={{
                  width: CANVAS_W,
                  height: CANVAS_H,
                  transform: `scale(${zoom})`,
                  touchAction: drag || wire ? "none" : "pan-x pan-y",
                }}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => {
                  setDrag(null);
                  setWire(null);
                }}
                onPointerDown={(e) => {
                  focusCanvas(e);
                  setSelected(null);
                }}
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes(DND_TYPE))
                    e.preventDefault();
                }}
                onDrop={(e) => {
                  const type = e.dataTransfer.getData(DND_TYPE);
                  if (!type) return;
                  e.preventDefault();
                  const p = toCanvas(e.clientX, e.clientY);
                  addNode(type, { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 });
                }}
                role="application"
                aria-label={`Architecture canvas with ${nodes.length} components and ${edges.length} connections`}
              >
                <svg
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className="absolute inset-0"
                >
                  <defs>
                    <marker
                      id={`arch-arrow-${diagramId}`}
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="8"
                      markerHeight="8"
                      orient="auto"
                    >
                      <path
                        d="M0,0 L10,5 L0,10 z"
                        className="fill-muted-foreground"
                      />
                    </marker>
                    <marker
                      id={`arch-arrow-sel-${diagramId}`}
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="8"
                      markerHeight="8"
                      orient="auto"
                    >
                      <path d="M0,0 L10,5 L0,10 z" className="fill-primary" />
                    </marker>
                  </defs>
                  {edges.map((edge) => {
                    const a = byId.get(edge.from);
                    const b = byId.get(edge.to);
                    if (!a || !b) return null;
                    const pa = posOf(a);
                    const pb = posOf(b);
                    const p1 = edgePoint(
                      pa,
                      pb.x + NODE_W / 2,
                      pb.y + NODE_H / 2,
                    );
                    const p2 = edgePoint(
                      pb,
                      pa.x + NODE_W / 2,
                      pa.y + NODE_H / 2,
                    );
                    const isSel =
                      selected?.kind === "edge" && selected.id === edge.id;
                    return (
                      <g key={edge.id}>
                        <line
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke="transparent"
                          strokeWidth={14}
                          className="cursor-pointer"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            focusCanvas(e);
                            setSelected({ kind: "edge", id: edge.id });
                          }}
                        />
                        <line
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          className={cn(
                            "pointer-events-none",
                            isSel
                              ? "stroke-primary"
                              : "stroke-muted-foreground/70",
                          )}
                          strokeWidth={isSel ? 2 : 1.5}
                          markerEnd={`url(#${isSel ? "arch-arrow-sel" : "arch-arrow"}-${diagramId})`}
                        />
                        {edge.label && (
                          <text
                            x={(p1.x + p2.x) / 2}
                            y={(p1.y + p2.y) / 2 - 6}
                            textAnchor="middle"
                            className="pointer-events-none fill-muted-foreground font-mono text-[11px]"
                          >
                            {edge.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {wire &&
                    (() => {
                      const from = byId.get(wire.from);
                      if (!from) return null;
                      const p = posOf(from);
                      return (
                        <line
                          x1={p.x + NODE_W}
                          y1={p.y + NODE_H / 2}
                          x2={wire.x}
                          y2={wire.y}
                          className="pointer-events-none stroke-primary"
                          strokeWidth={1.5}
                          strokeDasharray="5 4"
                        />
                      );
                    })()}
                </svg>

                {nodes.map((n) => {
                  const m = componentMeta(n.type);
                  const Icon = m.icon;
                  const p = posOf(n);
                  const isSel =
                    selected?.kind === "node" && selected.id === n.id;
                  const isSource = tapConnect.from === n.id;
                  return (
                    <div
                      key={n.id}
                      data-node-id={n.id}
                      onPointerDown={onNodePointerDown(n)}
                      onDoubleClick={() => {
                        setSelected({ kind: "node", id: n.id });
                        requestAnimationFrame(() => labelRef.current?.select());
                      }}
                      className={cn(
                        "group absolute flex cursor-grab touch-none items-center gap-2 rounded-lg border bg-card px-2.5 shadow-sm transition-shadow active:cursor-grabbing",
                        isSel && "border-primary/70 ring-2 ring-primary/30",
                        isSource && "border-info ring-2 ring-info/40",
                        drag?.id === n.id && "shadow-lg",
                      )}
                      style={{
                        left: p.x,
                        top: p.y,
                        width: NODE_W,
                        height: NODE_H,
                      }}
                    >
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-md",
                          m.tone,
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium">
                          {n.label}
                        </span>
                        <span className="block truncate font-mono text-[9px] text-muted-foreground uppercase">
                          {m.label}
                        </span>
                      </span>
                      {n.note && (
                        <MessageSquareText
                          className="size-3.5 shrink-0 text-muted-foreground"
                          aria-label="Has a note"
                        />
                      )}
                      <span
                        onPointerDown={onHandlePointerDown(n)}
                        title="Drag to connect"
                        className="absolute top-1/2 -right-[7px] size-3.5 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-card bg-primary opacity-60 transition-opacity group-hover:opacity-100"
                      />
                    </div>
                  );
                })}

                {!nodes.length && (
                  <div className="pointer-events-none absolute top-24 left-24 max-w-sm rounded-xl border border-dashed bg-card/70 p-5 text-sm text-muted-foreground backdrop-blur-sm">
                    <p className="font-medium text-foreground">
                      Start your architecture
                    </p>
                    <p className="mt-1">
                      Click a component on the left (or drag it here). Drag a
                      node to move it; drag from its blue dot to connect it to
                      another.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Inspector */}
        <aside aria-label="Inspector" className="space-y-4">
          {selNode ? (
            <div className="space-y-3 rounded-xl border bg-card p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Component
              </p>
              <div className="grid gap-1.5">
                <Label htmlFor="n-label">Name</Label>
                <Input
                  id="n-label"
                  ref={labelRef}
                  value={selNode.label}
                  onChange={(e) =>
                    patchNode(selNode.id, {
                      label: e.target.value.slice(0, 120),
                    })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="n-type">Type</Label>
                <NativeSelect
                  id="n-type"
                  value={selNode.type}
                  onChange={(e) =>
                    patchNode(selNode.id, { type: e.target.value })
                  }
                >
                  {COMPONENTS.map((c) => (
                    <option key={c.type} value={c.type}>
                      {c.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="n-note">Note</Label>
                <Textarea
                  id="n-note"
                  rows={4}
                  value={selNode.note ?? ""}
                  onChange={(e) =>
                    patchNode(selNode.id, { note: e.target.value || undefined })
                  }
                  placeholder="Responsibilities, tech choice, scaling notes…"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={removeSelected}
                className="w-full"
              >
                <Trash2 data-icon="inline-start" /> Delete component
              </Button>
            </div>
          ) : selEdge ? (
            <div className="space-y-3 rounded-xl border bg-card p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Connection
              </p>
              <p className="text-sm">
                {byId.get(selEdge.from)?.label} → {byId.get(selEdge.to)?.label}
              </p>
              <div className="grid gap-1.5">
                <Label htmlFor="e-label">Label</Label>
                <Input
                  id="e-label"
                  value={selEdge.label ?? ""}
                  onChange={(e) =>
                    patchEdge(selEdge.id, {
                      label: e.target.value.slice(0, 120) || undefined,
                    })
                  }
                  placeholder="e.g. HTTPS, publish, read"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    patchEdge(selEdge.id, {
                      from: selEdge.to,
                      to: selEdge.from,
                    })
                  }
                >
                  <ArrowLeftRight data-icon="inline-start" /> Reverse
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={removeSelected}
                >
                  <Trash2 data-icon="inline-start" /> Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border bg-card p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Diagram
              </p>
              <div className="grid gap-1.5">
                <Label htmlFor="d-title">Title</Label>
                <Input
                  id="d-title"
                  value={diagram.title}
                  onChange={(e) =>
                    save({ title: e.target.value.slice(0, 200) })
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="d-notes">Notes</Label>
                <Textarea
                  id="d-notes"
                  rows={5}
                  value={diagram.notes}
                  onChange={(e) => save({ notes: e.target.value })}
                  placeholder="Assumptions, request flow, bottlenecks…"
                />
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                {nodes.length} components · {edges.length} connections
              </p>
            </div>
          )}
          <ul className="space-y-1 px-1 text-[11px] text-muted-foreground">
            <li>Drag nodes to move · drag the blue dot to connect</li>
            <li>Double-click a node to rename</li>
            <li>Delete / Backspace removes the selection</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel, Shimmer, Tag } from "@/components/kit";
import { componentMeta } from "@/components/sd/components";
import { SD_INDEX } from "@/data/sd";
import { timeAgo } from "@/lib/format";
import { createDiagram, useHydrated, useStore } from "@/lib/progress";
import { cn } from "@/lib/utils";

/** Tiny static thumbnail of a diagram. */
function Thumb({ nodes, edges }: { nodes: { id: string; x: number; y: number; type: string }[]; edges: { from: string; to: string }[] }) {
  if (!nodes.length) return <div className="sd-canvas h-28 rounded-lg border" />;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX + 152;
  const h = Math.max(...ys) - minY + 52;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return (
    <svg viewBox={`${minX - 20} ${minY - 20} ${w + 40} ${h + 40}`} className="sd-canvas h-28 w-full rounded-lg border" aria-hidden preserveAspectRatio="xMidYMid meet">
      {edges.map((e, i) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        return <line key={i} x1={a.x + 76} y1={a.y + 26} x2={b.x + 76} y2={b.y + 26} className="stroke-muted-foreground/60" strokeWidth={4} />;
      })}
      {nodes.map((n) => (
        <rect key={n.id} x={n.x} y={n.y} width={152} height={52} rx={10} className={cn("fill-card stroke-border")} strokeWidth={3} />
      ))}
    </svg>
  );
}

export default function ArchitecturePage() {
  const state = useStore();
  const hydrated = useHydrated();
  const router = useRouter();
  const diagrams = Object.values(state.diagrams).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System Design"
        title="Architecture"
        subtitle="Your architecture diagrams: standalone sketches and the ones attached to HLD problems."
        actions={
          <Button onClick={() => router.push(`/system-design/architecture/${createDiagram()}`)}>
            <Plus data-icon="inline-start" /> New diagram
          </Button>
        }
      />
      {!hydrated ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Shimmer key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : diagrams.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No diagrams yet"
          description="Sketch a system from scratch, or open an HLD problem and create its architecture there."
          action={
            <Button size="sm" onClick={() => router.push(`/system-design/architecture/${createDiagram()}`)}>
              Create your first diagram
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {diagrams.map((d) => {
            const problem = d.problemKey ? SD_INDEX.get(d.problemKey) : undefined;
            const types = [...new Set(d.nodes.map((n) => componentMeta(n.type).label))].slice(0, 4);
            return (
              <li key={d.id}>
                <Link href={`/system-design/architecture/${d.id}`} className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Panel interactive className="flex h-full flex-col gap-3 p-3">
                    <Thumb nodes={d.nodes} edges={d.edges} />
                    <div className="px-1">
                      <p className="truncate font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.nodes.length} components · {d.edges.length} connections · edited {timeAgo(d.updatedAt)}
                      </p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-1.5 px-1">
                      {problem && <Tag className="bg-info/10 text-info">{problem.title}</Tag>}
                      {types.map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                  </Panel>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

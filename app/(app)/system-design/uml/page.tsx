"use client";

import Link from "next/link";
import { ArrowRight, SquareDashedKanban } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DifficultyBadge, EmptyState, PageHeader, Panel, SectionTitle, Shimmer, Tag } from "@/components/kit";
import { SDStatusBadge } from "@/components/sd/sd-kit";
import { toUML, lldDefaults, type LLDWorkspaceData } from "@/components/sd/lld-workspace";
import { UMLDiagram, UMLLegend } from "@/components/sd/uml-diagram";
import { LLD_CATEGORY_LIST, conceptsIn } from "@/data/sd";
import { useHydrated, useStore } from "@/lib/progress";
import { useSDItems } from "@/lib/sd";

/** Hub for LLD class designs: every LLD problem's UML at a glance, plus UML references. */
export default function UMLHubPage() {
  const state = useStore();
  const hydrated = useHydrated();
  const items = useSDItems().filter((x) => x.kind === "problem" && x.track === "lld");
  const designs = items.map((x) => {
    const ws: LLDWorkspaceData = { ...lldDefaults(), ...(state.sd[x.key]?.workspace as Partial<LLDWorkspaceData> | undefined) };
    return { item: x, ws, spec: toUML(ws) };
  });
  const started = designs.filter((d) => d.spec.classes.length > 0);
  const notStarted = designs.filter((d) => d.spec.classes.length === 0);
  const umlConcepts = conceptsIn(LLD_CATEGORY_LIST.find((c) => c.id === "uml-design")!.id);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="System Design · LLD"
        title="UML / LLD Design"
        subtitle="Your class designs across LLD problems, generated from the classes, interfaces and relationships you define."
      />

      <section aria-labelledby="uml-yours">
        <SectionTitle id="uml-yours" hint="Drag boxes inside a problem's workspace to arrange them; layouts are saved there.">
          Your class designs
        </SectionTitle>
        {!hydrated ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {Array.from({ length: 2 }, (_, i) => (
              <Shimmer key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : started.length ? (
          <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {started.map(({ item, ws, spec }) => (
              <li key={item.key}>
                <Panel className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">{item.title}</span>
                      {item.difficulty && <DifficultyBadge difficulty={item.difficulty} />}
                    </div>
                    <SDStatusBadge entry={state.sd[item.key]} />
                  </div>
                  <UMLDiagram spec={spec} positions={ws.umlLayout} className="max-h-80" />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">
                      {spec.classes.length} types · {spec.relations.length} relationships{ws.patterns.length ? ` · ${ws.patterns.length} patterns` : ""}
                    </span>
                    <Link href={`${item.href}#uml`} className={buttonVariants({ size: "sm", variant: "secondary" })}>
                      Edit design <ArrowRight data-icon="inline-end" />
                    </Link>
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={SquareDashedKanban}
            title="No class designs yet"
            description="Open an LLD problem, add classes and relationships, and its UML class diagram appears here."
            action={
              <Link href="/system-design/problems/parking-lot#classes" className={buttonVariants({ size: "sm" })}>
                Design a parking lot
              </Link>
            }
          />
        )}
      </section>

      {hydrated && notStarted.length > 0 && (
        <section aria-labelledby="uml-next">
          <SectionTitle id="uml-next" hint="LLD problems you haven't designed yet.">
            Start a design
          </SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {notStarted.map(({ item }) => (
              <li key={item.key}>
                <Link
                  href={`${item.href}#classes`}
                  className="inline-flex items-center gap-2 rounded-lg border bg-surface px-3 py-1.5 text-sm outline-none transition-colors hover:border-foreground/15 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.title}
                  {item.difficulty && <DifficultyBadge difficulty={item.difficulty} />}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="uml-ref" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle id="uml-ref">Reading UML relationships</SectionTitle>
          <Panel className="p-4">
            <UMLLegend />
          </Panel>
        </div>
        <div>
          <SectionTitle>UML & class-design concepts</SectionTitle>
          <ul className="space-y-2">
            {umlConcepts.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/system-design/concepts/${c.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-surface px-3 py-2.5 outline-none transition-colors hover:border-foreground/15 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <SDStatusBadge entry={state.sd[`concept:${c.id}`]} compact />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{c.summary}</span>
                  </span>
                  <Tag>LLD</Tag>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

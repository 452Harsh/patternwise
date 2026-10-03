"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Blocks, Boxes, CalendarClock, Component, Gauge, Network, Orbit, Plus, Rocket, Shapes, Timer, TriangleAlert, Workflow } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ActivityFeed } from "@/components/activity-feed";
import { DailyPlan } from "@/components/daily-plan";
import { DifficultyBadge, EmptyState, Meter, PageHeader, Panel, SectionTitle, Shimmer, masteryTone, pct } from "@/components/kit";
import { Metric } from "@/components/metric";
import { CoachPick } from "@/components/coach/coach-pick";
import { SDStatusBadge, TrackTag } from "@/components/sd/sd-kit";
import { HLD_PATTERNS, LLD_PATTERNS } from "@/data/sd";
import { relativeDay } from "@/lib/format";
import { createDiagram, useHydrated, useStore } from "@/lib/progress";
import { categoryStats, sdItemsFor, sdOverview } from "@/lib/sd";

export default function SystemDesignOverview() {
  const state = useStore();
  const hydrated = useHydrated();
  const router = useRouter();

  if (!hydrated) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Loading System Design">
        <Shimmer className="h-9 w-72" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Panel key={i} className="space-y-3 p-4">
              <Shimmer className="h-3 w-20" />
              <Shimmer className="h-8 w-16" />
              <Shimmer className="h-1.5 w-full" />
            </Panel>
          ))}
        </div>
      </div>
    );
  }

  const o = sdOverview(state);
  const items = sdItemsFor(state);
  const weakCategories = [...categoryStats(state, "hld"), ...categoryStats(state, "lld")]
    .filter((c) => c.started > 0)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 5);
  const recent = o.recent.slice(0, 3);

  const sections = [
    { href: "/system-design/hld", label: "High-Level Design", icon: Network, detail: `${o.hld.concepts.total} concepts · ${o.hld.problems.total} problems`, value: o.hld.mastery },
    { href: "/system-design/lld", label: "Low-Level Design", icon: Component, detail: `${o.lld.concepts.total} concepts · ${o.lld.patterns.total} patterns`, value: o.lld.mastery },
    { href: "/system-design/concepts", label: "Concepts", icon: Blocks, detail: `${o.conceptsTotal} concepts`, value: o.conceptsMastered / o.conceptsTotal },
    { href: "/system-design/patterns", label: "Patterns", icon: Shapes, detail: `${HLD_PATTERNS.length} architecture · ${LLD_PATTERNS.length} design`, value: (o.hld.patterns.mastered + o.lld.patterns.mastered) / (o.hld.patterns.total + o.lld.patterns.total) },
    { href: "/system-design/problems", label: "Problems", icon: Boxes, detail: `${o.problemsTotal} design problems`, value: o.problemsCompleted / Math.max(1, o.problemsTotal) },
    { href: "/system-design/architecture", label: "Architecture", icon: Workflow, detail: `${Object.keys(state.diagrams).length} diagram${Object.keys(state.diagrams).length === 1 ? "" : "s"}`, value: 0 },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="System Design"
        title="Design at every scale"
        subtitle="High-level architecture and low-level object design, tracked like the rest of your prep."
        actions={
          <>
            <Link href="/system-design/interview" className={buttonVariants({ variant: "secondary" })}>
              <Timer data-icon="inline-start" /> Interview mode
            </Link>
            <Button onClick={() => router.push(`/system-design/architecture/${createDiagram()}`)}>
              <Plus data-icon="inline-start" /> New diagram
            </Button>
          </>
        }
      />

      <CoachPick ctx="sd" />

      <section aria-label="System Design progress" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Metric icon={Orbit} label="Overall progress" value={pct(o.overall)} sub="HLD + LLD mastery" progress={o.overall} />
        <Metric icon={Network} label="HLD progress" value={pct(o.hld.mastery)} sub={`${o.hld.concepts.started}/${o.hld.concepts.total} concepts started`} progress={o.hld.mastery} tone="info" href="/system-design/hld" />
        <Metric icon={Component} label="LLD progress" value={pct(o.lld.mastery)} sub={`${o.lld.patterns.mastered}/${o.lld.patterns.total} patterns strong`} progress={o.lld.mastery} href="/system-design/lld" />
        <Metric icon={Blocks} label="Concepts mastered" value={o.conceptsMastered} sub={`of ${o.conceptsTotal} · confidence ≥ 4`} progress={o.conceptsMastered / o.conceptsTotal} tone="success" href="/system-design/concepts" />
        <Metric icon={Boxes} label="Problems completed" value={o.problemsCompleted} sub={`of ${o.problemsTotal} design problems`} progress={o.problemsCompleted / Math.max(1, o.problemsTotal)} tone="success" href="/system-design/problems" />
        <Metric
          icon={CalendarClock}
          label="Revision due"
          value={o.due.length}
          sub={o.due.length ? <span className="text-warning">Review these first</span> : "Nothing due"}
          tone="warning"
          href="/system-design/revision"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="min-w-0 lg:col-span-3" aria-labelledby="sd-today">
          <SectionTitle id="sd-today" hint="Generated each morning from your weakest and next System Design topics." action={<Link href="/system-design/study-plan" className="text-xs text-muted-foreground hover:text-foreground">Study plan →</Link>}>
            Today&apos;s tasks
          </SectionTitle>
          <DailyPlan tracks={["hld", "lld"]} />
        </section>
        <section className="min-w-0 lg:col-span-2" aria-labelledby="sd-weak">
          <SectionTitle id="sd-weak" hint="Lowest mastery among categories you've started.">
            Weak areas
          </SectionTitle>
          {weakCategories.length || o.weak.length ? (
            <Panel className="space-y-4 p-4">
              {weakCategories.map(({ category, mastery }) => (
                <Link key={category.id} href={`/system-design/${category.track}#${category.id}`} className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="flex items-center gap-2 truncate">
                      <TrackTag track={category.track} /> {category.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{pct(mastery)}</span>
                  </div>
                  <Meter value={mastery} tone={masteryTone(mastery)} label={`${category.name} mastery`} />
                </Link>
              ))}
              {o.weak.length > 0 && (
                <div className="border-t pt-3">
                  <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <TriangleAlert className="size-3 text-warning" aria-hidden /> Low confidence
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {o.weak.slice(0, 6).map((x) => (
                      <Link key={x.key} href={x.href} className="rounded-md border px-2 py-1 text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                        {x.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          ) : (
            <EmptyState icon={Gauge} title="Nothing to analyse yet" description="Rate a few concepts and your weak spots show up here." />
          )}
        </section>
      </div>

      <section aria-labelledby="sd-continue">
        <SectionTitle id="sd-continue" hint="The System Design items you touched most recently.">
          Continue learning
        </SectionTitle>
        {recent.length ? (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {recent.map((x) => {
              const e = state.sd[x.key];
              return (
                <li key={x.key}>
                  <Panel interactive className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 font-medium leading-snug">{x.title}</p>
                      {x.difficulty ? <DifficultyBadge difficulty={x.difficulty} /> : <TrackTag track={x.track} />}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{x.summary}</p>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Last touched</dt>
                        <dd className="font-mono">{relativeDay(e.updatedAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Next review</dt>
                        <dd className="font-mono">{relativeDay(e.nextReview)}</dd>
                      </div>
                    </dl>
                    <div className="mt-auto flex items-center justify-between border-t pt-3">
                      <SDStatusBadge entry={e} />
                      <Link href={x.href} className={buttonVariants({ size: "sm", variant: "secondary" })}>
                        Continue <ArrowRight data-icon="inline-end" />
                      </Link>
                    </div>
                  </Panel>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={Rocket}
            title="Your System Design journey starts here"
            description="Begin with the core distributed-systems concepts, or jump straight into an LLD pattern."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/system-design/concepts/scalability" className={buttonVariants({ size: "sm" })}>
                  Start with Scalability
                </Link>
                <Link href="/system-design/patterns/strategy" className={buttonVariants({ size: "sm", variant: "outline" })}>
                  Learn the Strategy pattern
                </Link>
              </div>
            }
          />
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-labelledby="sd-explore" className="min-w-0">
          <SectionTitle id="sd-explore">Explore</SectionTitle>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sections.map((sct) => {
              const Icon = sct.icon;
              return (
                <li key={sct.href}>
                  <Link href={sct.href} className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Panel interactive className="flex h-full items-start gap-3 p-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{sct.label}</span>
                        <span className="block text-xs text-muted-foreground">{sct.detail}</span>
                        {sct.value > 0 && <Meter value={sct.value} className="mt-2" label={`${sct.label} progress`} />}
                      </span>
                    </Panel>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
        <section aria-labelledby="sd-activity" className="min-w-0">
          <SectionTitle id="sd-activity" hint={`${items.length} items in the System Design library.`}>
            Recent activity
          </SectionTitle>
          <ActivityFeed limit={7} scope="sd" />
        </section>
      </div>
    </div>
  );
}

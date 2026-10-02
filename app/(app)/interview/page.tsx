"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Plus, Presentation, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Confidence, EmptyState, Meter, PageHeader, Panel, Ring, SectionTitle, Shimmer, pct } from "@/components/kit";
import { TimedPractice } from "@/components/timed-practice";
import { allPatterns } from "@/data/curriculum";
import { PHASES } from "@/data/study-plan";
import { shortDate } from "@/lib/format";
import { addCompany, addMock, isSolved, removeMock, toggleChecklist, today, useHydrated, useStore } from "@/lib/progress";
import { overview, phaseProgress } from "@/lib/stats";
import { cn } from "@/lib/utils";

const SUGGESTED = ["Google", "Amazon", "Meta", "Microsoft", "Apple", "Netflix"];

const CHECKLIST = [
  { id: "essentials", text: "Re-solve every interview essential you rated below 4" },
  { id: "templates", text: "Write the template for each core pattern from memory" },
  { id: "complexity", text: "State time & space for each essential without looking" },
  { id: "explain", text: "Explain your approach out loud before coding (rubber-duck or record yourself)" },
  { id: "edge", text: "Review your Mistakes notes; list your 5 most common slips" },
  { id: "timed", text: "Do at least 5 timed problems at target time" },
  { id: "mocks", text: "Complete 2+ mock interviews in the final two weeks" },
  { id: "behavioral", text: "Prepare 6–8 behavioural stories (STAR format)" },
];

export default function InterviewPage() {
  const state = useStore();
  const hydrated = useHydrated();
  const router = useRouter();
  const [mockOpen, setMockOpen] = useState(false);
  const [company, setCompany] = useState("");

  if (!hydrated) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Shimmer className="h-9 w-64" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Shimmer key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const o = overview(state);
  const phases = phaseProgress(state);
  const practiced = allPatterns
    .map(({ pattern, topic }) => ({
      pattern,
      topic,
      attempts: pattern.problems.reduce((a, p) => a + (state.problems[p.slug]?.history.length ?? 0), 0),
    }))
    .filter((x) => x.attempts > 0)
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 8);
  const maxAttempts = Math.max(1, ...practiced.map((x) => x.attempts));

  const create = (name: string) => {
    const n = name.trim();
    if (!n) return;
    const id = addCompany(n);
    setCompany("");
    toast.success(`Created ${n} list`);
    router.push(`/interview/companies/${id}`);
  };

  const parts = [
    { label: "Interview essentials solved", value: o.readinessParts.essentials, weight: "35%" },
    { label: "Core pattern mastery", value: o.readinessParts.coreMastery, weight: "35%" },
    { label: "Essentials revised & not overdue", value: o.readinessParts.revisionHealth, weight: "15%" },
    { label: "Mock interviews vs target", value: o.readinessParts.mocks, weight: "15%" },
  ];

  return (
    <div className="space-y-10">
      <PageHeader title="Interview Prep" subtitle="Turn pattern knowledge into performance under time pressure." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="p-5">
          <SectionTitle hint="A weighted score from your own data.">Readiness</SectionTitle>
          <div className="flex items-center gap-5">
            <Ring value={o.readiness} size={96} stroke={9} label={`Interview readiness ${pct(o.readiness)}`}>
              <span className="font-mono text-xl font-semibold">{pct(o.readiness)}</span>
            </Ring>
            <ul className="min-w-0 flex-1 space-y-2">
              {parts.map((p) => (
                <li key={p.label}>
                  <div className="mb-0.5 flex justify-between gap-2 text-[11px]">
                    <span className="truncate text-muted-foreground">{p.label}</span>
                    <span className="font-mono">{p.weight}</span>
                  </div>
                  <Meter value={p.value} label={p.label} />
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel className="p-5 lg:col-span-2">
          <SectionTitle
            hint="Your preparation roadmap."
            action={
              <Link href="/study-plan" className="text-xs text-muted-foreground hover:text-foreground">
                Study plan →
              </Link>
            }
          >
            DSA preparation roadmap
          </SectionTitle>
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {phases.map(({ phase, value }, i) => (
              <li key={phase.id} className="rounded-lg border bg-surface p-3">
                <p className="font-mono text-[10px] text-muted-foreground">PHASE {i + 1}</p>
                <p className="mt-0.5 truncate text-sm font-medium" title={phase.name}>
                  {phase.name}
                </p>
                <Meter value={value} tone={value >= 0.8 ? "success" : "primary"} className="mt-2" label={`${phase.name} progress`} />
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{pct(value)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            {PHASES.length} phases · {o.essentials.solved}/{o.essentials.total} interview essentials solved.{" "}
            <Link href="/problems?only=essentials" className="text-primary hover:underline">
              Practise essentials →
            </Link>
          </p>
        </Panel>
      </div>

      <section id="companies" aria-labelledby="companies-h" className="scroll-mt-20">
        <SectionTitle id="companies-h" hint="Your own target lists. This app makes no claims about what any company actually asks.">
          Company preparation lists
        </SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.companies.map((c) => {
            const solved = c.slugs.filter((s) => isSolved(state.problems[s])).length;
            return (
              <Link key={c.id} href={`/interview/companies/${c.id}`} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Panel interactive className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-muted font-semibold">{c.name.slice(0, 1).toUpperCase()}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.slugs.length} saved problem{c.slugs.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="font-mono text-sm">{c.slugs.length ? pct(solved / c.slugs.length) : "—"}</span>
                  </div>
                  <Meter value={c.slugs.length ? solved / c.slugs.length : 0} className="mt-3" label={`${c.name} progress`} />
                </Panel>
              </Link>
            );
          })}
          <Panel className="border-dashed p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                create(company);
              }}
              className="flex gap-2"
            >
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" aria-label="New company list name" />
              <Button type="submit" size="icon" aria-label="Create list" disabled={!company.trim()}>
                <Plus />
              </Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SUGGESTED.filter((s) => !state.companies.some((c) => c.name.toLowerCase() === s.toLowerCase())).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => create(s)}
                  className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  + {s}
                </button>
              ))}
            </div>
          </Panel>
        </div>
        {state.companies.length === 0 && (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-4" aria-hidden /> No saved lists yet. Create one for each company you&apos;re targeting.
          </p>
        )}
      </section>

      <section id="timed" aria-labelledby="timed-h" className="scroll-mt-20">
        <SectionTitle id="timed-h" hint="Targets: Easy 20 min · Medium 35 min · Hard 50 min.">
          Timed practice
        </SectionTitle>
        <TimedPractice />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section id="mocks" aria-labelledby="mocks-h" className="scroll-mt-20">
          <SectionTitle
            id="mocks-h"
            hint={`${state.mocks.length} of ${state.settings.mockTarget} target`}
            action={
              <Button size="sm" variant="secondary" onClick={() => setMockOpen(true)}>
                <Plus data-icon="inline-start" /> Log mock
              </Button>
            }
          >
            Mock interviews
          </SectionTitle>
          {state.mocks.length ? (
            <Panel className="divide-y">
              {state.mocks.map((m) => (
                <div key={m.id} className="flex items-start gap-3 px-4 py-3">
                  <Presentation className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-medium">{m.title}</span>
                      <Confidence value={m.rating} />
                      <span className="font-mono text-xs text-muted-foreground">
                        {shortDate(m.date)} · {m.minutes}m
                      </span>
                    </div>
                    {m.notes && <p className="mt-1 text-sm text-muted-foreground">{m.notes}</p>}
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label={`Delete mock ${m.title}`} onClick={() => removeMock(m.id)}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </Panel>
          ) : (
            <EmptyState icon={Presentation} title="No mock interviews yet" description="Do one with a friend or a platform, then log how it went." />
          )}
        </section>

        <section aria-labelledby="practiced-h">
          <SectionTitle id="practiced-h" hint="By your logged attempts.">
            Your most practised patterns
          </SectionTitle>
          {practiced.length ? (
            <Panel className="space-y-3 p-4">
              {practiced.map(({ pattern, attempts }) => (
                <Link key={pattern.id} href={`/patterns/${pattern.id}`} className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="truncate">{pattern.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{attempts}</span>
                  </div>
                  <Meter value={attempts / maxAttempts} tone="info" label={`${pattern.name} attempts`} />
                </Link>
              ))}
            </Panel>
          ) : (
            <EmptyState icon={Presentation} title="No attempts yet" description="Patterns you practise most will rank here." />
          )}
        </section>
      </div>

      <section aria-labelledby="checklist-h">
        <SectionTitle id="checklist-h" hint="For the final two weeks before interviews.">
          Revision checklist
        </SectionTitle>
        <Panel className="divide-y">
          {CHECKLIST.map((c) => {
            const done = !!state.checklist[c.id];
            return (
              <label key={c.id} className="flex cursor-pointer items-center gap-3 px-4 py-3">
                <Checkbox
                  checked={done}
                  onCheckedChange={(v) => toggleChecklist(c.id, v === true)}
                  className="data-checked:animate-pop data-checked:border-success data-checked:bg-success"
                />
                <span className={cn("text-sm", done && "text-muted-foreground line-through")}>{c.text}</span>
              </label>
            );
          })}
        </Panel>
      </section>

      <MockDialog open={mockOpen} onOpenChange={setMockOpen} />
    </div>
  );
}

function MockDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <MockForm onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function MockForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("Mock interview");
  const [date, setDate] = useState(today());
  const [minutes, setMinutes] = useState("45");
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState("");
  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault();
        addMock({ title: title.trim() || "Mock interview", date, minutes: Number(minutes) || 45, rating, notes });
        toast.success("Mock interview logged");
        onDone();
      }}
    >
      <DialogHeader>
        <DialogTitle>Log a mock interview</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="m-title">Title</Label>
          <Input id="m-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="m-date">Date</Label>
            <Input id="m-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="dark:[color-scheme:dark]" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="m-min">Minutes</Label>
            <Input id="m-min" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} className="font-mono" />
          </div>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">How did it go?</legend>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={rating === n}
                onClick={() => setRating(n)}
                className={cn(
                  "size-9 rounded-lg border font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  n <= rating ? "border-primary/50 bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-1.5">
          <Label htmlFor="m-notes">Notes</Label>
          <Textarea id="m-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What went well? What to fix next time?" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
}


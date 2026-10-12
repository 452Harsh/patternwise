"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Flag, Pause, Play, Shuffle, Timer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Confidence, DifficultyBadge, EmptyState, PageHeader, Panel, SectionTitle, Tag } from "@/components/kit";
import { NativeSelect } from "@/components/native-select";
import { PromptField } from "@/components/sd/workspace-kit";
import { TrackTag } from "@/components/sd/sd-kit";
import { findProblem, type SDItem } from "@/data/sd";
import { duration, shortDate } from "@/lib/format";
import { addSDSession, removeSDSession, useHydrated, useStore } from "@/lib/progress";
import { useSDItems } from "@/lib/sd";
import { cn } from "@/lib/utils";

type Mode = "hld" | "lld" | "mixed";

const PHASES = {
  hld: [
    ["requirements", "Requirements", 5],
    ["capacity", "Capacity estimation", 5],
    ["api", "API design", 5],
    ["architecture", "Architecture", 10],
    ["database", "Database", 5],
    ["scaling", "Scaling", 5],
    ["tradeoffs", "Trade-offs", 5],
    ["deep-dive", "Deep dive", 5],
  ],
  lld: [
    ["requirements", "Requirements & scope", 5],
    ["actors", "Actors & use cases", 5],
    ["classes", "Classes & interfaces", 10],
    ["relationships", "Relationships / UML", 5],
    ["patterns", "Design patterns", 5],
    ["code", "Core code", 10],
    ["review", "Extensibility review", 5],
  ],
} as const;

const randomItem = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

const fmt = (sec: number) => {
  const s = Math.abs(sec);
  return `${sec < 0 ? "+" : ""}${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

function InterviewInner() {
  const params = useSearchParams();
  const state = useStore();
  const hydrated = useHydrated();
  const items = useSDItems();
  const problems = useMemo(() => items.filter((x) => x.kind === "problem"), [items]);

  const preset = params.get("item");
  const [mode, setMode] = useState<Mode>((params.get("mode") as Mode) ?? "mixed");
  const [pickKey, setPickKey] = useState<string>(preset ?? "");
  const [minutes, setMinutes] = useState(45);
  const [session, setSession] = useState<{ startedAt: number; pausedAt?: number; pausedTotal: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [finished, setFinished] = useState<{ durationSec: number; startedAt: string } | null>(null);
  const [phases, setPhases] = useState<Record<string, boolean>>({});
  const [debrief, setDebrief] = useState({ wentWell: "", difficult: "", missing: "", toRevise: "", confidence: 3 });

  const pool = problems.filter((x) => mode === "mixed" || x.track === mode);
  const pick: SDItem | undefined = problems.find((x) => x.key === pickKey);
  const track = pick?.track ?? (mode === "lld" ? "lld" : "hld");
  const phaseList = PHASES[track];

  useEffect(() => {
    if (!session || session.pausedAt) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [session]);

  // Warn before leaving mid-session.
  useEffect(() => {
    if (!session) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [session]);

  const elapsed = session ? Math.round(((session.pausedAt ?? now) - session.startedAt - session.pausedTotal) / 1000) : 0;
  const remaining = minutes * 60 - elapsed;

  const shuffle = () => {
    if (!pool.length) return;
    const options = pool.filter((x) => x.key !== pickKey);
    setPickKey(randomItem(options.length ? options : pool).key);
  };

  const start = () => {
    if (!pick) return;
    const t = Date.now();
    setSession({ startedAt: t, pausedTotal: 0 });
    setNow(t);
    setFinished(null);
    setPhases({});
  };

  const togglePause = () => {
    if (!session) return;
    const t = Date.now();
    if (session.pausedAt) setSession({ ...session, pausedAt: undefined, pausedTotal: session.pausedTotal + (t - session.pausedAt) });
    else setSession({ ...session, pausedAt: t });
    setNow(t);
  };

  const finish = () => {
    if (!session) return;
    setFinished({ durationSec: Math.max(0, elapsed), startedAt: new Date(session.startedAt).toISOString() });
    setSession(null);
  };

  const save = () => {
    if (!pick || !finished) return;
    addSDSession({
      mode,
      itemKey: pick.key,
      title: pick.title,
      startedAt: finished.startedAt,
      plannedMin: minutes,
      durationSec: finished.durationSec,
      phases,
      ...debrief,
    });
    toast.success("Session saved");
    setFinished(null);
    setDebrief({ wentWell: "", difficult: "", missing: "", toRevise: "", confidence: 3 });
  };

  const statement = pick ? (findProblem(pick.id)?.problem.statement ?? pick.summary) : "";

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="System Design" title="Interview mode" subtitle="A timed, end-to-end design session — then an honest debrief." />

      {!session && !finished && (
        <Panel className="space-y-5 p-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5">
              <span className="text-xs text-muted-foreground">Mode</span>
              <NativeSelect value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                <option value="hld">HLD</option>
                <option value="lld">LLD</option>
                <option value="mixed">Mixed</option>
              </NativeSelect>
            </label>
            <label className="grid min-w-64 flex-1 gap-1.5">
              <span className="text-xs text-muted-foreground">Problem</span>
              <NativeSelect value={pickKey} onChange={(e) => setPickKey(e.target.value)}>
                <option value="">Choose a problem…</option>
                {pool.map((x) => (
                  <option key={x.key} value={x.key}>
                    {x.title} ({x.track.toUpperCase()}
                    {x.difficulty ? ` · ${x.difficulty}` : ""})
                  </option>
                ))}
              </NativeSelect>
            </label>
            <Button variant="secondary" onClick={shuffle} disabled={!pool.length}>
              <Shuffle data-icon="inline-start" /> Random
            </Button>
            <label className="grid gap-1.5">
              <span className="text-xs text-muted-foreground">Time</span>
              <NativeSelect value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                {[30, 45, 60, 75].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </NativeSelect>
            </label>
          </div>
          {pick ? (
            <div className="rounded-xl border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <TrackTag track={pick.track} />
                {pick.difficulty && <DifficultyBadge difficulty={pick.difficulty} />}
                <p className="font-medium">{pick.title}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{statement}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Pick a problem or hit Random. Treat it like the real thing: talk through your thinking.</p>
          )}
          <Button size="lg" onClick={start} disabled={!pick}>
            <Play data-icon="inline-start" /> Start session
          </Button>
        </Panel>
      )}

      {session && pick && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Panel className="space-y-5 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <TrackTag track={pick.track} />
              {pick.difficulty && <DifficultyBadge difficulty={pick.difficulty} />}
            </div>
            <h2 className="text-xl font-semibold tracking-tight">{pick.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{statement}</p>
            <Link href={pick.href} target="_blank" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              Open the workspace in a new tab <ExternalLink className="size-3.5" aria-hidden />
            </Link>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Cover each phase (suggested minutes for a 45-minute round)</p>
              <ul className="divide-y rounded-xl border">
                {phaseList.map(([id, label, mins]) => (
                  <li key={id}>
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5">
                      <Checkbox
                        checked={!!phases[id]}
                        onCheckedChange={(v) => setPhases({ ...phases, [id]: v === true })}
                        className="data-checked:animate-pop data-checked:border-success data-checked:bg-success"
                      />
                      <span className={cn("flex-1 text-sm", phases[id] && "text-muted-foreground line-through")}>{label}</span>
                      <span className="font-mono text-xs text-muted-foreground">{mins}m</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Panel className="p-5 text-center">
              <p className="text-xs text-muted-foreground">{remaining >= 0 ? "Time left" : "Over time"}</p>
              <p className={cn("mt-1 font-mono text-5xl font-semibold tabular-nums", remaining < 0 ? "text-destructive" : remaining < 300 ? "text-warning" : "text-foreground")} aria-live="off">
                {fmt(remaining)}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {Object.values(phases).filter(Boolean).length}/{phaseList.length} phases · {session.pausedAt ? "paused" : "running"}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" onClick={togglePause}>
                  {session.pausedAt ? <Play data-icon="inline-start" /> : <Pause data-icon="inline-start" />}
                  {session.pausedAt ? "Resume" : "Pause"}
                </Button>
                <Button onClick={finish}>
                  <Flag data-icon="inline-start" /> Finish
                </Button>
              </div>
            </Panel>
          </aside>
        </div>
      )}

      {finished && pick && (
        <Panel className="space-y-5 p-5">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {duration(finished.durationSec) || "0s"} · {Object.values(phases).filter(Boolean).length}/{phaseList.length} phases covered
            </p>
            <h2 className="mt-1 text-lg font-semibold">Debrief: {pick.title}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <PromptField label="What went well" value={debrief.wentWell} onChange={(v) => setDebrief({ ...debrief, wentWell: v })} placeholder="Clear requirements, solid capacity maths…" />
            <PromptField label="What was difficult" value={debrief.difficult} onChange={(v) => setDebrief({ ...debrief, difficult: v })} placeholder="Ran out of time on the deep dive…" />
            <PromptField label="Missing concepts" value={debrief.missing} onChange={(v) => setDebrief({ ...debrief, missing: v })} placeholder="Consistent hashing, idempotency keys…" />
            <PromptField label="Things to revise" value={debrief.toRevise} onChange={(v) => setDebrief({ ...debrief, toRevise: v })} placeholder="Re-read the sharding notes; redo the API section" />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Personal confidence</legend>
            <div className="flex flex-wrap gap-1.5">
              {["Forgot / lost", "Shaky", "OK", "Strong", "Interview-ready"].map((l, i) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={debrief.confidence === i + 1}
                  onClick={() => setDebrief({ ...debrief, confidence: i + 1 })}
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    debrief.confidence === i + 1 ? "border-primary/50 bg-primary/12 font-medium" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Confidence value={i + 1} /> {l}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <Button onClick={save}>Save session</Button>
            <Button variant="ghost" onClick={() => setFinished(null)}>
              Discard
            </Button>
          </div>
        </Panel>
      )}

      <section aria-labelledby="past-h">
        <SectionTitle id="past-h" hint="Each saved session also counts as a review of that problem.">
          Past sessions
        </SectionTitle>
        {hydrated && state.sdSessions.length ? (
          <Panel className="divide-y">
            {state.sdSessions.map((s) => (
              <div key={s.id} className="flex items-start gap-3 px-4 py-3">
                <Timer className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium">{s.title}</span>
                    <Tag className="uppercase">{s.mode}</Tag>
                    <Confidence value={s.confidence} />
                    <span className="font-mono text-xs text-muted-foreground">
                      {shortDate(s.startedAt.slice(0, 10))} · {duration(s.durationSec) || "0s"} of {s.plannedMin}m · {Object.values(s.phases).filter(Boolean).length} phases
                    </span>
                  </div>
                  {(s.difficult || s.missing) && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {[s.difficult && `Difficult: ${s.difficult}`, s.missing && `Missing: ${s.missing}`].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon-sm" aria-label={`Delete session ${s.title}`} onClick={() => removeSDSession(s.id)}>
                  <Trash2 />
                </Button>
              </div>
            ))}
          </Panel>
        ) : (
          <EmptyState icon={Timer} title="No sessions yet" description="Run your first timed design session above." />
        )}
      </section>
    </div>
  );
}

export default function InterviewModePage() {
  return (
    <Suspense>
      <InterviewInner />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUp, Check, ChevronRight, Flag, Play, RotateCcw, Save, Sparkles, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DifficultyBadge, PageHeader, Panel, Shimmer } from "@/components/kit";
import { NativeSelect } from "@/components/native-select";
import { TrackTag } from "@/components/sd/sd-kit";
import { CoachMarkdown, CtxSwitch, ModelStatus, StopButton, Thinking, newId, useCoachCtx, useCoachStatus, useCoachStream } from "@/components/coach/coach-kit";
import { allPatterns } from "@/data/curriculum";
import { analyzeDSA } from "@/lib/coach/dsa";
import { stagesFor, type InterviewKind } from "@/lib/coach/interview";
import { interviewDaysLeft, prefsOf } from "@/lib/coach/plan";
import { analyzeSD } from "@/lib/coach/sd";
import { useCatalog } from "@/lib/catalog";
import { addSDSession, logAttempt, today, useHydrated, useStore, type AttemptResult } from "@/lib/progress";
import { useSDItems } from "@/lib/sd";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
  /** Shown as a small marker instead of a bubble (stage changes, start). */
  marker?: boolean;
}

/** Wall-clock time, read only from event handlers and effects. */
const clock = () => Date.now();

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Interview() {
  const state = useStore();
  const hydrated = useHydrated();
  const params = useSearchParams();
  const [ctx, setCtx] = useCoachCtx();
  const { status, refresh } = useCoachStatus();
  const catalog = useCatalog();
  const sdItems = useSDItems();
  const sdProblems = sdItems.filter((x) => x.kind === "problem");

  const itemParam = params.get("item");
  const initialKind: InterviewKind = ctx === "dsa" ? "dsa" : (sdProblems.find((x) => x.key === itemParam)?.track ?? "hld");
  const [kind, setKind] = useState<InterviewKind>(initialKind);
  const [slug, setSlug] = useState(params.get("slug") ?? "");
  const [sdKey, setSdKey] = useState(itemParam ?? "");
  const [phase, setPhase] = useState<"setup" | "live" | "done">("setup");
  const [stageIdx, setStageIdx] = useState(0);
  /** Stages actually discussed (skipped ones aren't shown as covered). */
  const [visited, setVisited] = useState<number[]>([0]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState(newId);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [saved, setSaved] = useState(false);
  const ai = useCoachStream();
  const endRef = useRef<HTMLDivElement>(null);

  // Context switch resets the session; kind follows the context.
  const effectiveKind: InterviewKind = ctx === "dsa" ? "dsa" : kind === "dsa" ? "hld" : kind;
  const stages = stagesFor(effectiveKind);

  useEffect(() => {
    if (phase !== "live" || startedAt === null) return;
    const t = setInterval(() => setElapsed(Math.round((clock() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase, startedAt]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, ai.text]);

  // Recommended picks come from the recommendation engine, per module.
  const recommended = useMemo(() => {
    if (!hydrated) return [];
    const date = today();
    const prefs = prefsOf(state);
    const left = interviewDaysLeft(prefs, date);
    if (ctx === "dsa") {
      const a = analyzeDSA(state, date, prefs, left);
      const recs = [a.focus, ...a.ranked.slice(0, 4)].filter((r) => !!r);
      const seen = new Set<string>();
      return recs
        .flatMap((r) => r!.problems.filter((p) => p.role !== "guided").slice(0, 1).map((p) => ({ id: p.slug, title: p.title, sub: `${r!.patternName} · ${p.why}`, difficulty: p.difficulty })))
        .filter((x) => !seen.has(x.id) && !!seen.add(x.id))
        .slice(0, 4);
    }
    const a = analyzeSD(state, date, left);
    const seen = new Set<string>();
    return [a.focus, ...a.ranked.slice(0, 6)]
      .filter((r) => !!r)
      .flatMap((r) => r!.exercises.map((e) => ({ id: e.key, title: e.title, sub: e.why, track: e.track })))
      .filter((x) => !seen.has(x.id) && !!seen.add(x.id))
      .slice(0, 4);
  }, [hydrated, state, ctx]);

  const problemTitle = ctx === "dsa" ? catalog.find((c) => c.problem.slug === slug)?.problem.title : sdProblems.find((x) => x.key === sdKey)?.title;
  const ready = ctx === "dsa" ? !!slug : !!sdKey;

  const ask = async (msgs: Msg[], idx: number) => {
    const reply = await ai.run({
      ctx,
      mode: "interview",
      threadId,
      messages: msgs.map(({ role, content }) => ({ role, content })),
      ref: { kind: effectiveKind, stage: stages[idx].id, ...(ctx === "dsa" ? { slug } : { sdKey }) },
    });
    return reply;
  };

  const start = async () => {
    const first: Msg[] = [{ role: "user", content: "I'm ready. Let's begin the interview.", marker: true }];
    setThreadId(newId());
    setMessages(first);
    setStageIdx(0);
    setVisited([0]);
    setFeedback("");
    setSaved(false);
    setPhase("live");
    setStartedAt(clock());
    setElapsed(0);
    const reply = await ask(first, 0);
    if (reply) setMessages([...first, { role: "assistant", content: reply }]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || ai.streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    const reply = await ask(next, stageIdx);
    if (reply) setMessages([...next, { role: "assistant", content: reply }]);
  };

  const goStage = async (idx: number) => {
    if (ai.streaming) return;
    const target = stages[idx];
    setStageIdx(idx);
    setVisited((v) => [...v, idx]);
    const next: Msg[] = [...messages, { role: "user", content: target.id === "feedback" ? "That's the end of the interview. Please give me your feedback." : `Let's move on to: ${target.label}.`, marker: true }];
    setMessages(next);
    const reply = await ask(next, idx);
    if (!reply) return;
    if (target.id === "feedback") {
      setFeedback(reply);
      setPhase("done");
    } else setMessages([...next, { role: "assistant", content: reply }]);
  };

  const score = Number(/Overall:\s*\**\s*([1-5])\s*\/\s*5/i.exec(feedback)?.[1] ?? 0);
  const [result, setResult] = useState<AttemptResult>("solved");
  const [confidence, setConfidence] = useState(3);
  useEffect(() => {
    // Prefill the save form from the interviewer's score once feedback arrives.
    if (!score) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfidence(score);
    setResult(score >= 4 ? "solved" : score >= 3 ? "hints" : "failed");
  }, [score]);

  const save = () => {
    const durationSec = elapsed;
    if (ctx === "dsa") {
      logAttempt(slug, { result, confidence, durationSec, note: `AI mock interview${score ? ` · interviewer score ${score}/5` : ""}` }, problemTitle);
    } else {
      const covered = Object.fromEntries(stages.map((s, i) => [s.id, visited.includes(i)]));
      const section = (h: string) => new RegExp(`\\*\\*${h}\\*\\*[^\\n]*\\n?([\\s\\S]*?)(?=\\n\\*\\*|$)`, "i").exec(feedback)?.[1]?.trim().slice(0, 1000) ?? "";
      addSDSession({
        mode: effectiveKind === "lld" ? "lld" : "hld",
        itemKey: sdKey,
        title: problemTitle ?? sdKey,
        startedAt: new Date(startedAt ?? clock()).toISOString(),
        plannedMin: 45,
        durationSec,
        phases: covered,
        wentWell: section("Strengths"),
        difficult: section("Gaps"),
        missing: "",
        toRevise: section("What to practise next"),
        confidence,
      });
    }
    setSaved(true);
    toast.success("Saved to your progress", { description: "Tomorrow's plan will take this session into account." });
  };

  if (!hydrated) return <Shimmer className="h-[600px] w-full rounded-xl" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" aria-hidden /> AI Coach
          </span>
        }
        title="Interview mode"
        subtitle="The coach plays the interviewer: it asks, challenges and follows up instead of teaching."
        actions={
          <>
            <CtxSwitch
              ctx={ctx}
              onChange={(c) => {
                setCtx(c);
                setPhase("setup");
                setMessages([]);
                setKind(c === "dsa" ? "dsa" : "hld");
                ai.reset();
              }}
            />
            <ModelStatus status={status} onIndexed={refresh} />
          </>
        }
      />

      {phase === "setup" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Panel className="space-y-5 p-5">
            {ctx === "sd" && (
              <div className="grid gap-1.5">
                <span className="text-sm font-medium">Interview type</span>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Interview type">
                  {(["hld", "lld"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={effectiveKind === k}
                      onClick={() => {
                        setKind(k);
                        setSdKey("");
                      }}
                      className={cn(
                        "h-9 rounded-lg border text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        effectiveKind === k ? "border-primary/50 bg-primary/10 font-medium" : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {k === "hld" ? "High-level design" : "Low-level design"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="iv-problem">Problem</Label>
              {ctx === "dsa" ? (
                <NativeSelect id="iv-problem" value={slug} onChange={(e) => setSlug(e.target.value)}>
                  <option value="">Choose a problem…</option>
                  {allPatterns.map(({ pattern }) => (
                    <optgroup key={pattern.id} label={pattern.name}>
                      {catalog
                        .filter((c) => c.pattern.id === pattern.id)
                        .map((c) => (
                          <option key={c.problem.slug} value={c.problem.slug}>
                            {c.problem.title} · {c.problem.difficulty}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </NativeSelect>
              ) : (
                <NativeSelect id="iv-problem" value={sdKey} onChange={(e) => setSdKey(e.target.value)}>
                  <option value="">Choose a design problem…</option>
                  {sdProblems
                    .filter((x) => x.track === effectiveKind)
                    .map((x) => (
                      <option key={x.key} value={x.key}>
                        {x.title}
                      </option>
                    ))}
                </NativeSelect>
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">How it runs</p>
              <ol className="flex flex-wrap gap-1.5">
                {stages.map((s, i) => (
                  <li key={s.id} className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs text-muted-foreground ring-1 ring-border">
                    <span className="font-mono">{i + 1}</span> {s.label}
                  </li>
                ))}
              </ol>
            </div>
            <Button onClick={start} disabled={!ready || !status?.ok}>
              <Play data-icon="inline-start" /> Start interview
            </Button>
            {status && !status.ok && <p className="text-xs text-destructive">{status.detail}</p>}
          </Panel>

          <Panel className="h-fit p-5">
            <p className="text-sm font-semibold">Recommended for you</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Picked by your recommendation engine from your weakest and most overdue areas.</p>
            {recommended.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Log some practice first and recommendations appear here.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {recommended.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (ctx === "dsa") setSlug(r.id);
                        else {
                          if ("track" in r && r.track) setKind(r.track);
                          setSdKey(r.id);
                        }
                      }}
                      className={cn(
                        "w-full rounded-lg border bg-surface p-3 text-left outline-none hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring",
                        (slug === r.id || sdKey === r.id) && "border-primary/50 bg-primary/5",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {r.title}
                        {"difficulty" in r && r.difficulty && <DifficultyBadge difficulty={r.difficulty} />}
                        {"track" in r && r.track && <TrackTag track={r.track} />}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{r.sub}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Panel className="h-fit p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="truncate text-sm font-medium">{problemTitle}</span>
              <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Timer className="size-3.5" aria-hidden /> {mmss(elapsed)}
              </span>
            </div>
            <ol className="space-y-0.5" aria-label="Interview stages">
              {stages.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={phase === "done" || ai.streaming || i <= stageIdx}
                    onClick={() => goStage(i)}
                    aria-current={i === stageIdx ? "step" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
                      i === stageIdx ? "bg-primary/10 font-medium text-foreground" : i < stageIdx ? (visited.includes(i) ? "text-muted-foreground" : "text-muted-foreground/50 line-through") : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <span className={cn("grid size-5 shrink-0 place-items-center rounded-full font-mono text-[10px] ring-1", i === stageIdx ? "bg-primary text-primary-foreground ring-primary" : i < stageIdx && visited.includes(i) ? "bg-success/15 text-success ring-success/30" : "ring-border")}>
                      {i !== stageIdx && i < stageIdx && visited.includes(i) ? <Check className="size-3" aria-hidden /> : i + 1}
                    </span>
                    {s.label}
                  </button>
                </li>
              ))}
            </ol>
            <div className="mt-3 grid gap-2 border-t pt-3">
              {phase === "live" && stageIdx < stages.length - 2 && (
                <Button variant="secondary" size="sm" disabled={ai.streaming} onClick={() => goStage(stageIdx + 1)}>
                  Next stage <ChevronRight data-icon="inline-end" />
                </Button>
              )}
              {phase === "live" && (
                <Button size="sm" disabled={ai.streaming || messages.length < 3} onClick={() => goStage(stages.length - 1)}>
                  <Flag data-icon="inline-start" /> End &amp; get feedback
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => (setPhase("setup"), ai.reset())}>
                <RotateCcw data-icon="inline-start" /> New interview
              </Button>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel className="flex min-h-[480px] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
                {messages.map((m, i) =>
                  m.marker ? (
                    <p key={i} className="text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {m.content.startsWith("Let's move on to: ") ? `→ ${m.content.slice(18, -1)}` : m.content.startsWith("That's the end") ? "→ Feedback" : "Interview started"}
                    </p>
                  ) : m.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm whitespace-pre-wrap text-primary-foreground">{m.content}</p>
                    </div>
                  ) : (
                    <div key={i} className="flex gap-3">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold" aria-hidden>
                        AI
                      </span>
                      <CoachMarkdown className="flex-1">{m.content}</CoachMarkdown>
                    </div>
                  ),
                )}
                {ai.streaming && phase === "live" && (
                  <div className="flex gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold" aria-hidden>
                      AI
                    </span>
                    {ai.text ? <CoachMarkdown className="flex-1">{ai.text}</CoachMarkdown> : <Thinking label="Interviewer is thinking" />}
                  </div>
                )}
                {ai.error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{ai.error}</p>}
                <div ref={endRef} />
              </div>
              {phase === "live" && (
                <form
                  className="flex items-end gap-2 border-t p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send();
                  }}
                >
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    rows={2}
                    placeholder={`Answer the interviewer… (stage: ${stages[stageIdx].label}). Shift+Enter for a new line.`}
                    aria-label="Your answer"
                    className="max-h-48 min-h-14 resize-y font-mono text-[13px]"
                  />
                  {ai.streaming ? (
                    <StopButton onClick={ai.stop} />
                  ) : (
                    <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send">
                      <ArrowUp />
                    </Button>
                  )}
                </form>
              )}
            </Panel>

            {(phase === "done" || (ai.streaming && stages[stageIdx].id === "feedback")) && (
              <Panel className="space-y-4 border-primary/30 p-5">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="size-4 text-primary" aria-hidden /> Interviewer feedback
                </p>
                {feedback ? <CoachMarkdown>{feedback}</CoachMarkdown> : ai.text ? <CoachMarkdown>{ai.text}</CoachMarkdown> : <Thinking label="Reviewing the transcript" />}
                {phase === "done" && (
                  <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-surface p-3">
                    {ctx === "dsa" && (
                      <div className="grid gap-1.5">
                        <Label htmlFor="iv-result">Result</Label>
                        <NativeSelect id="iv-result" value={result} onChange={(e) => setResult(e.target.value as AttemptResult)}>
                          <option value="solved">Solved</option>
                          <option value="hints">Solved with hints</option>
                          <option value="failed">Couldn&apos;t solve</option>
                        </NativeSelect>
                      </div>
                    )}
                    <div className="grid gap-1.5">
                      <Label htmlFor="iv-conf">{ctx === "dsa" ? "Confidence" : "Rating"}</Label>
                      <NativeSelect id="iv-conf" value={confidence} onChange={(e) => setConfidence(Number(e.target.value))}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}/5
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                    <Button onClick={save} disabled={saved}>
                      {saved ? <Check data-icon="inline-start" /> : <Save data-icon="inline-start" />}
                      {saved ? "Saved to progress" : "Save to my progress"}
                    </Button>
                    {saved && (
                      <Link href="/coach" className="text-sm font-medium text-primary hover:underline">
                        Back to today&apos;s plan →
                      </Link>
                    )}
                  </div>
                )}
              </Panel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoachInterviewPage() {
  return (
    <Suspense fallback={<Shimmer className="h-[600px] w-full rounded-xl" />}>
      <Interview />
    </Suspense>
  );
}

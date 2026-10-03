"use client";

import { useMemo, useState } from "react";
import { Eye, Lightbulb, Loader2, ScanSearch, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/kit";
import { NativeSelect } from "@/components/native-select";
import { allPatterns } from "@/data/curriculum";
import { SD_ITEMS } from "@/data/sd";
import type { CoachCtx } from "@/lib/coach/types";
import { useCatalog } from "@/lib/catalog";
import { rateSD, updatePattern } from "@/lib/progress";
import { useSDItems } from "@/lib/sd";
import { cn } from "@/lib/utils";
import { CoachMarkdown, SourceFooter, StopButton, Thinking, newId, useCoachStream } from "./coach-kit";

/* ---------- Spot the pattern ---------- */

export function RecognizeTool({ ctx }: { ctx: CoachCtx }) {
  const [text, setText] = useState("");
  const ai = useCoachStream();
  const go = () =>
    ai.run({ ctx, mode: "recognize", threadId: newId(), messages: [{ role: "user", content: text.trim() }], ref: { problemText: text.trim() } });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel className="space-y-3 p-5">
        <Label htmlFor="rec-text">{ctx === "dsa" ? "Paste a coding problem you haven't seen before" : "Paste a system design prompt"}</Label>
        <Textarea
          id="rec-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder={
            ctx === "dsa"
              ? "Given an array of integers and an integer k, return the length of the longest subarray whose sum is at most k…"
              : "Design a service that lets users upload photos and see a feed of photos from people they follow…"
          }
        />
        <div className="flex items-center gap-2">
          <Button onClick={go} disabled={text.trim().length < 20 || ai.streaming}>
            <ScanSearch data-icon="inline-start" /> {ctx === "dsa" ? "Which pattern is this?" : "Which concepts apply?"}
          </Button>
          {ai.streaming && <StopButton onClick={ai.stop} />}
        </div>
        <p className="text-xs text-muted-foreground">The coach names the pattern, the clues and the questions to ask yourself. It won&apos;t solve it for you.</p>
      </Panel>
      <Panel className="min-h-64 p-5">
        {ai.error && <p className="text-sm text-destructive">{ai.error}</p>}
        {ai.text ? <CoachMarkdown>{ai.text}</CoachMarkdown> : ai.streaming ? <Thinking label="Matching against the pattern library" /> : !ai.error && <p className="text-sm text-muted-foreground">Results appear here.</p>}
        {!ai.streaming && <SourceFooter meta={ai.meta} />}
      </Panel>
    </div>
  );
}

/* ---------- Progressive hints ---------- */

const HINT_NAMES = ["Conceptual", "Pattern", "Approach", "Detailed guidance"];

export function HintsTool({ ctx, initialSlug, initialItem }: { ctx: CoachCtx; initialSlug?: string; initialItem?: string }) {
  const catalog = useCatalog();
  const sdItems = useSDItems();
  const sdProblems = sdItems.filter((x) => x.kind === "problem");
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [sdKey, setSdKey] = useState(initialItem ?? "");
  const [text, setText] = useState("");
  const [hints, setHints] = useState<string[]>([]);
  const [threadId, setThreadId] = useState(newId);
  const ai = useCoachStream();
  const level = hints.length + 1;
  const ready = ctx === "dsa" ? !!slug || text.trim().length > 20 : !!sdKey || text.trim().length > 20;
  const title = ctx === "dsa" ? catalog.find((c) => c.problem.slug === slug)?.problem.title : sdProblems.find((x) => x.key === sdKey)?.title;

  const reset = () => {
    setHints([]);
    setThreadId(newId());
    ai.reset();
  };

  const next = async () => {
    const messages = [
      { role: "user" as const, content: title ? `I'm working on ${title}. ${text}`.trim() : text.trim() },
      ...hints.flatMap((h, i) => [
        { role: "assistant" as const, content: h },
        { role: "user" as const, content: `I need hint ${i + 2}.` },
      ]),
    ];
    const reply = await ai.run({
      ctx,
      mode: "hints",
      threadId,
      messages,
      ref: { level, ...(ctx === "dsa" ? { slug: slug || undefined } : { sdKey: sdKey || undefined }), problemText: text.trim() || undefined },
    });
    if (reply) {
      setHints((h) => [...h, reply]);
      ai.reset();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Panel className="h-fit space-y-4 p-5">
        <div className="grid gap-1.5">
          <Label htmlFor="hint-problem">{ctx === "dsa" ? "Problem" : "Design problem"}</Label>
          {ctx === "dsa" ? (
            <NativeSelect id="hint-problem" value={slug} onChange={(e) => (setSlug(e.target.value), reset())}>
              <option value="">Paste my own below…</option>
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
            <NativeSelect id="hint-problem" value={sdKey} onChange={(e) => (setSdKey(e.target.value), reset())}>
              <option value="">Paste my own below…</option>
              {(["hld", "lld"] as const).map((t) => (
                <optgroup key={t} label={t.toUpperCase()}>
                  {sdProblems
                    .filter((x) => x.track === t)
                    .map((x) => (
                      <option key={x.key} value={x.key}>
                        {x.title}
                      </option>
                    ))}
                </optgroup>
              ))}
            </NativeSelect>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="hint-text">{slug || sdKey ? "Where you're stuck (optional)" : "Problem statement"}</Label>
          <Textarea id="hint-text" value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={slug || sdKey ? "I have a brute force but it's O(n²)…" : "Paste the problem…"} />
        </div>
        <ol className="grid grid-cols-4 gap-1.5" aria-label="Hint levels">
          {HINT_NAMES.map((n, i) => (
            <li key={n} className={cn("rounded-md border px-2 py-1.5 text-center text-[11px]", i < hints.length ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground")}>
              <span className="block font-mono">{i + 1}</span>
              {n}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button onClick={next} disabled={!ready || ai.streaming || hints.length >= 4}>
            {ai.streaming ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Lightbulb data-icon="inline-start" />}
            {hints.length >= 4 ? "All hints revealed" : `Reveal hint ${level}: ${HINT_NAMES[level - 1]}`}
          </Button>
          {hints.length > 0 && (
            <Button variant="ghost" onClick={reset}>
              Start over
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Each hint reveals a little more. Try the problem again before asking for the next one.</p>
      </Panel>

      <div className="space-y-3">
        {hints.length === 0 && !ai.streaming && (
          <Panel className="p-5 text-sm text-muted-foreground">
            <Eye className="mb-2 size-5" aria-hidden />
            Hints appear here one at a time, from a conceptual nudge to detailed guidance.
          </Panel>
        )}
        {hints.map((h, i) => (
          <Panel key={i} className="p-5">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-primary">
              Hint {i + 1} · {HINT_NAMES[i]}
            </p>
            <CoachMarkdown>{h}</CoachMarkdown>
          </Panel>
        ))}
        {ai.streaming && (
          <Panel className="p-5">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-primary">
              Hint {level} · {HINT_NAMES[level - 1]}
            </p>
            {ai.text ? <CoachMarkdown>{ai.text}</CoachMarkdown> : <Thinking />}
          </Panel>
        )}
        {ai.error && <p className="text-sm text-destructive">{ai.error}</p>}
      </div>
    </div>
  );
}

/* ---------- Explain it back ---------- */

export function ExplainTool({ ctx, initialPattern, initialItem }: { ctx: CoachCtx; initialPattern?: string; initialItem?: string }) {
  const sdChoices = useMemo(() => SD_ITEMS.filter((x) => x.kind === "concept" || x.kind === "pattern"), []);
  const [patternId, setPatternId] = useState(initialPattern ?? allPatterns[0].pattern.id);
  const [sdKey, setSdKey] = useState(initialItem && sdChoices.some((x) => x.key === initialItem) ? initialItem : sdChoices[0].key);
  const [text, setText] = useState("");
  const ai = useCoachStream();
  const subject = ctx === "dsa" ? allPatterns.find((x) => x.pattern.id === patternId)?.pattern.name : sdChoices.find((x) => x.key === sdKey)?.title;
  const score = Number(/Score:\s*\**\s*([1-5])\s*\/\s*5/i.exec(ai.text)?.[1] ?? 0);

  const go = () =>
    ai.run({
      ctx,
      mode: "explain",
      threadId: newId(),
      messages: [{ role: "user", content: text.trim() }],
      ref: ctx === "dsa" ? { patternId } : { sdKey },
    });

  // Feed the result back into progress so tomorrow's plan reflects it.
  const apply = () => {
    if (!score || !subject) return;
    if (ctx === "dsa") {
      const status = score >= 4 ? "understood" : score <= 2 ? "needs-practice" : "learning";
      updatePattern(patternId, { status }, subject);
      toast.success(`${subject} marked “${status.replace("-", " ")}”`);
    } else {
      rateSD(sdKey, score, { title: subject });
      toast.success(`${subject} rated ${score}/5`, { description: "Its next review is scheduled from this rating." });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel className="space-y-4 p-5">
        <div className="grid gap-1.5">
          <Label htmlFor="ex-subject">{ctx === "dsa" ? "Pattern" : "Concept or pattern"}</Label>
          {ctx === "dsa" ? (
            <NativeSelect id="ex-subject" value={patternId} onChange={(e) => (setPatternId(e.target.value), ai.reset())}>
              {allPatterns.map(({ pattern, topic }) => (
                <option key={pattern.id} value={pattern.id}>
                  {pattern.name} · {topic.name}
                </option>
              ))}
            </NativeSelect>
          ) : (
            <NativeSelect id="ex-subject" value={sdKey} onChange={(e) => (setSdKey(e.target.value), ai.reset())}>
              {sdChoices.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.title} · {x.track.toUpperCase()}
                </option>
              ))}
            </NativeSelect>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ex-text">Explain {subject} in your own words</Label>
          <Textarea
            id="ex-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="When does it apply? What's the core idea or invariant? What are the common mistakes or trade-offs?"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={go} disabled={text.trim().length < 30 || ai.streaming}>
            <Sparkles data-icon="inline-start" /> Check my explanation
          </Button>
          {ai.streaming && <StopButton onClick={ai.stop} />}
        </div>
      </Panel>
      <Panel className="min-h-64 p-5">
        {ai.error && <p className="text-sm text-destructive">{ai.error}</p>}
        {ai.text ? <CoachMarkdown>{ai.text}</CoachMarkdown> : ai.streaming ? <Thinking label="Comparing with the material" /> : !ai.error && <p className="text-sm text-muted-foreground">Feedback appears here, with a score out of 5.</p>}
        {!ai.streaming && score > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border bg-surface p-3 text-sm">
            <span>
              Score <span className="font-mono font-semibold">{score}/5</span>
            </span>
            <Button size="sm" variant="secondary" onClick={apply}>
              {ctx === "dsa" ? "Update my pattern rating" : "Save as my rating"}
            </Button>
          </div>
        )}
        {!ai.streaming && <SourceFooter meta={ai.meta} />}
      </Panel>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, Code2, Cpu, Database, Gauge, Loader2, Network, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CoachCtx, PriorityLevel, Signal } from "@/lib/coach/types";
import { syncNow, today } from "@/lib/progress";
import { cn } from "@/lib/utils";

/* ---------- module context (DSA | System Design) ---------- */

const CTX_KEY = "pw:coach:ctx";
const ctxListeners = new Set<() => void>();
const readCtx = (): CoachCtx => {
  try {
    return localStorage.getItem(CTX_KEY) === "sd" ? "sd" : "dsa";
  } catch {
    return "dsa";
  }
};

/**
 * Which module the coach works in. `?ctx=` wins (deep links), then the last choice.
 * DSA and System Design never share coach context.
 */
export function useCoachCtx(): [CoachCtx, (c: CoachCtx) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const remembered = useSyncExternalStore(
    (cb) => {
      ctxListeners.add(cb);
      return () => ctxListeners.delete(cb);
    },
    readCtx,
    () => "dsa" as CoachCtx,
  );
  const fromUrl = params.get("ctx");
  const ctx: CoachCtx = fromUrl === "sd" || fromUrl === "dsa" ? fromUrl : remembered;

  useEffect(() => {
    if (fromUrl !== "sd" && fromUrl !== "dsa") return;
    try {
      if (localStorage.getItem(CTX_KEY) !== fromUrl) {
        localStorage.setItem(CTX_KEY, fromUrl);
        ctxListeners.forEach((l) => l());
      }
    } catch {}
  }, [fromUrl]);

  const set = useCallback(
    (c: CoachCtx) => {
      try {
        localStorage.setItem(CTX_KEY, c);
      } catch {}
      ctxListeners.forEach((l) => l());
      router.replace(`${pathname}?ctx=${c}`, { scroll: false });
    },
    [router, pathname],
  );
  return [ctx, set];
}

export function CtxSwitch({ ctx, onChange, className }: { ctx: CoachCtx; onChange: (c: CoachCtx) => void; className?: string }) {
  const opts: { id: CoachCtx; label: string; icon: typeof Code2 }[] = [
    { id: "dsa", label: "DSA", icon: Code2 },
    { id: "sd", label: "System Design", icon: Network },
  ];
  return (
    <div role="radiogroup" aria-label="Coach context" className={cn("inline-grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-0.5 rounded-lg border bg-surface p-0.5", className)}>
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={ctx === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            ctx === o.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <o.icon className="size-4" aria-hidden />
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- streaming ---------- */

export interface CoachRequest {
  ctx: CoachCtx;
  mode: "plan" | "ask" | "recognize" | "hints" | "explain" | "interview";
  threadId?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  ref?: {
    slug?: string;
    patternId?: string;
    sdKey?: string;
    problemText?: string;
    level?: number;
    stage?: string;
    kind?: "dsa" | "hld" | "lld";
  };
}

export interface StreamMeta {
  model: string;
  retrieval: string;
  sources: { title: string; href: string }[];
}

const ERROR_MARK = "[coach-error]";

/** Streams a coach reply. Pending progress edits are saved first so the server sees the latest data. */
export function useCoachStream() {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<StreamMeta | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => () => ctrl.current?.abort(), []);

  const run = useCallback(async (req: CoachRequest): Promise<string | null> => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setText("");
    setError(null);
    setStreaming(true);
    let full = "";
    try {
      await syncNow();
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...req, date: today() }),
        signal: c.signal,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Coach request failed (${res.status})`);
      }
      setMeta({
        model: decodeURIComponent(res.headers.get("X-Coach-Model") ?? ""),
        retrieval: res.headers.get("X-Coach-Retrieval") ?? "none",
        sources: JSON.parse(decodeURIComponent(res.headers.get("X-Coach-Sources") ?? "%5B%5D")),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        const cut = full.indexOf(ERROR_MARK);
        setText(cut >= 0 ? full.slice(0, cut).trimEnd() : full);
      }
      const cut = full.indexOf(ERROR_MARK);
      if (cut >= 0) {
        setError(full.slice(cut + ERROR_MARK.length).trim());
        return null;
      }
      return full;
    } catch (err) {
      if ((err as Error).name === "AbortError") return null;
      setError(err instanceof Error ? err.message : "Something went wrong");
      return null;
    } finally {
      if (ctrl.current === c) setStreaming(false);
    }
  }, []);

  const stop = useCallback(() => {
    ctrl.current?.abort();
    setStreaming(false);
  }, []);

  const reset = useCallback(() => {
    ctrl.current?.abort();
    setText("");
    setError(null);
    setMeta(null);
    setStreaming(false);
  }, []);

  return { text, streaming, error, meta, run, stop, reset, setText };
}

/* ---------- rendering ---------- */

export function CoachMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "coach-md min-w-0 text-sm leading-relaxed text-foreground/90",
        "[&_p]:my-2 [&_p:first-child]:mt-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
        "[&_strong]:font-semibold [&_strong]:text-foreground [&_h1]:mt-4 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-surface [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_table]:my-2 [&_table]:w-full [&_table]:text-xs [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

export function Thinking({ label = "Thinking" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}…
    </span>
  );
}

export function StopButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      <Square data-icon="inline-start" /> Stop
    </Button>
  );
}

const RETRIEVAL_LABEL: Record<string, string> = {
  "atlas-vector-search": "Atlas Vector Search",
  "in-memory-vectors": "vector search (local)",
  keyword: "keyword search",
  none: "no retrieval",
};

/** Where the answer came from: the open model and the curriculum material it was given. */
export function SourceFooter({ meta }: { meta: StreamMeta | null }) {
  if (!meta) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t pt-2.5 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Cpu className="size-3" aria-hidden /> {meta.model.split(":").slice(1).join(":") || meta.model}
      </span>
      {meta.sources.length > 0 && (
        <span className="inline-flex min-w-0 flex-wrap items-center gap-1">
          <BookOpen className="size-3" aria-hidden /> Grounded in
          {meta.sources.map((s, i) => (
            <a key={s.href + i} href={s.href} className="rounded bg-muted px-1.5 py-0.5 text-foreground/80 hover:text-foreground">
              {s.title.replace(/^(Pattern|Problem|Topic|HLD concept|LLD concept|HLD architecture pattern|LLD design pattern|HLD problem|LLD problem): /, "")}
            </a>
          ))}
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <Database className="size-3" aria-hidden /> {RETRIEVAL_LABEL[meta.retrieval] ?? meta.retrieval}
      </span>
    </div>
  );
}

/* ---------- priority ---------- */

const LEVEL_CLASS: Record<PriorityLevel, string> = {
  high: "bg-warning/10 text-warning ring-warning/25",
  medium: "bg-primary/10 text-primary ring-primary/25",
  low: "bg-muted text-muted-foreground ring-border",
};

/** Practice priority with the exact signals that produced it. */
export function PriorityBadge({ priority, level, signals }: { priority: number; level: PriorityLevel; signals: Signal[] }) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn("inline-flex h-6 items-center gap-1.5 rounded-md px-2 font-mono text-[11px] font-semibold ring-1 ring-inset outline-none focus-visible:ring-2 focus-visible:ring-ring", LEVEL_CLASS[level])}
        aria-label={`Priority ${priority} of 100, ${level}. Show how it was calculated`}
      >
        <Gauge className="size-3.5" aria-hidden />
        {priority}
        <span className="font-sans font-medium capitalize">{level}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <p className="text-xs font-semibold">How this priority was calculated</p>
        <ul className="space-y-2">
          {signals.map((s) => (
            <li key={s.key} className="text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{s.label}</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {s.points}/{s.weight}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${s.value * 100}%` }} />
              </div>
              <p className="mt-1 text-muted-foreground">{s.detail}</p>
            </li>
          ))}
        </ul>
        <p className="border-t pt-2 text-[11px] text-muted-foreground">Computed from your logged attempts and ratings, not by the AI model.</p>
      </PopoverContent>
    </Popover>
  );
}

/* ---------- model status ---------- */

export interface CoachStatus {
  provider: string;
  model: string;
  embedModel: string;
  ok: boolean;
  detail: string;
  knowledge: { documents: number; expected: number; embedModel: string | null; index: string } | null;
}

export function useCoachStatus() {
  const [status, setStatus] = useState<CoachStatus | null>(null);
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/coach/status", { cache: "no-store" });
      if (res.ok) setStatus(await res.json());
    } catch {}
  }, []);
  useEffect(() => {
    // Fetch on mount: subscribes this component to the server status.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);
  return { status, refresh };
}

export function ModelStatus({ status, onIndexed }: { status: CoachStatus | null; onIndexed?: () => void }) {
  const [building, setBuilding] = useState(false);
  if (!status) return <span className="h-6 w-40 animate-pulse rounded-md bg-muted" aria-hidden />;
  const k = status.knowledge;
  const needsIndex = !k || k.documents < k.expected || k.embedModel !== status.embedModel;

  const build = async () => {
    setBuilding(true);
    try {
      const res = await fetch("/api/coach/knowledge", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Indexing failed");
      toast.success("Knowledge base ready", { description: `${body.total} documents · ${body.embedded} embedded · Atlas index ${body.vectorIndex}` });
      onIndexed?.();
    } catch (err) {
      toast.error("Couldn't build the knowledge base", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setBuilding(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger className="inline-flex h-7 items-center gap-2 rounded-lg border bg-surface px-2.5 text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        <span className={cn("size-2 rounded-full", status.ok ? (needsIndex ? "bg-warning" : "bg-success") : "bg-destructive")} aria-hidden />
        <span className="font-mono">{status.model}</span>
        <span className="text-muted-foreground">{status.ok ? (needsIndex ? "· index needed" : "· ready") : "· offline"}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 text-xs">
        <p className="font-semibold">Open-weight coach model</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
          <dt className="text-muted-foreground">Model</dt>
          <dd className="font-mono">{status.model}</dd>
          <dt className="text-muted-foreground">Provider</dt>
          <dd>{status.provider}</dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd>{status.detail}</dd>
          <dt className="text-muted-foreground">Embeddings</dt>
          <dd className="font-mono">{status.embedModel}</dd>
          <dt className="text-muted-foreground">Knowledge</dt>
          <dd>{k ? `${k.documents}/${k.expected} documents · vector index ${k.index}` : "unavailable"}</dd>
        </dl>
        <p className="text-muted-foreground">Only curriculum content is indexed. Your progress, notes and conversations are never added to it.</p>
        <Button size="sm" variant={needsIndex ? "default" : "secondary"} disabled={building || !status.ok} onClick={build}>
          {building ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Database data-icon="inline-start" />}
          {building ? "Indexing… (about a minute)" : needsIndex ? "Build knowledge base" : "Re-index knowledge"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export const newId = () => `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

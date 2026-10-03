"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, History, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/kit";
import type { CoachCtx } from "@/lib/coach/types";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CoachMarkdown, SourceFooter, StopButton, Thinking, newId, useCoachStream, type CoachRequest, type StreamMeta } from "./coach-kit";

export interface Msg {
  role: "user" | "assistant";
  content: string;
  meta?: StreamMeta | null;
}

interface ThreadRow {
  id: string;
  title: string;
  updatedAt: string;
}

/** Conversation with the coach. Threads are saved server-side as private user data. */
export function CoachChat({
  ctx,
  suggestions,
  placeholder,
}: {
  ctx: CoachCtx;
  suggestions: string[];
  placeholder: string;
}) {
  const [threadId, setThreadId] = useState(newId);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const ai = useCoachStream();
  const endRef = useRef<HTMLDivElement>(null);

  const loadThreads = () =>
    fetch(`/api/coach/threads?ctx=${ctx}&mode=ask`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { threads: [] }))
      .then((d: { threads: ThreadRow[] }) => setThreads(d.threads))
      .catch(() => {});

  useEffect(() => {
    void loadThreads();
    // New context, new conversation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([]);
    setThreadId(newId());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, ai.text]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || ai.streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    const req: CoachRequest = { ctx, mode: "ask", threadId, messages: next.map(({ role, content }) => ({ role, content })) };
    const reply = await ai.run(req);
    if (reply !== null) {
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      void loadThreads();
    }
  };

  // Keep the footer metadata of the latest reply once streaming ends.
  const lastMeta = ai.meta;

  const open = async (id: string) => {
    const res = await fetch(`/api/coach/threads?id=${id}`, { cache: "no-store" });
    if (!res.ok) return;
    const { thread } = (await res.json()) as { thread: { id: string; messages: Msg[] } };
    ai.reset();
    setThreadId(thread.id);
    setMessages(thread.messages.map(({ role, content }) => ({ role, content })));
  };

  const remove = async (id: string) => {
    await fetch("/api/coach/threads", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (id === threadId) {
      setMessages([]);
      setThreadId(newId());
    }
    void loadThreads();
  };

  const fresh = () => {
    ai.reset();
    setMessages([]);
    setThreadId(newId());
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <Panel className="flex min-h-[520px] flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5" aria-live="polite">
          {messages.length === 0 && !ai.streaming && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Ask about your own preparation. The coach answers from your logged history and the platform&apos;s material.</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-lg border bg-surface px-3 py-1.5 text-left text-sm outline-none hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "user" ? (
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm whitespace-pre-wrap text-primary-foreground">{m.content}</p>
              ) : (
                <div className="max-w-full min-w-0 flex-1">
                  <CoachMarkdown>{m.content}</CoachMarkdown>
                  {i === messages.length - 1 && <SourceFooter meta={lastMeta} />}
                </div>
              )}
            </div>
          ))}
          {ai.streaming && <div className="min-w-0">{ai.text ? <CoachMarkdown>{ai.text}</CoachMarkdown> : <Thinking label="Looking at your history" />}</div>}
          {ai.error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{ai.error}</p>}
          <div ref={endRef} />
        </div>
        <form
          className="flex items-end gap-2 border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder={placeholder}
            rows={1}
            aria-label="Message the coach"
            className="max-h-40 min-h-9 resize-none"
          />
          {ai.streaming ? (
            <StopButton onClick={ai.stop} />
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send">
              <ArrowUp />
            </Button>
          )}
        </form>
      </Panel>

      <Panel className="h-fit p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <History className="size-3.5" aria-hidden /> Conversations
          </p>
          <Button variant="ghost" size="sm" onClick={fresh}>
            <Plus data-icon="inline-start" /> New
          </Button>
        </div>
        {threads.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">Nothing yet. Conversations are private to you.</p>
        ) : (
          <ul className="space-y-0.5">
            {threads.map((t) => (
              <li key={t.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => open(t.id)}
                  className={cn(
                    "min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                    t.id === threadId && "bg-muted",
                  )}
                >
                  <span className="block truncate">{t.title}</span>
                  <span className="text-[11px] text-muted-foreground">{timeAgo(t.updatedAt)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  aria-label={`Delete “${t.title}”`}
                  className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 outline-none group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

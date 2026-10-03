"use client";

import { Suspense, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lightbulb, MessageCircleQuestion, ScanSearch, Sparkles } from "lucide-react";
import { PageHeader, Shimmer } from "@/components/kit";
import { CoachChat } from "@/components/coach/chat";
import { CtxSwitch, ModelStatus, useCoachCtx, useCoachStatus } from "@/components/coach/coach-kit";
import { ExplainTool, HintsTool, RecognizeTool } from "@/components/coach/tools";
import { analyzeDSA } from "@/lib/coach/dsa";
import { interviewDaysLeft, prefsOf } from "@/lib/coach/plan";
import { analyzeSD } from "@/lib/coach/sd";
import { today, useHydrated, useStore } from "@/lib/progress";
import { cn } from "@/lib/utils";

const TOOLS = [
  { id: "ask", label: "Ask", icon: MessageCircleQuestion },
  { id: "recognize", label: "Spot the pattern", icon: ScanSearch },
  { id: "hints", label: "Hints", icon: Lightbulb },
  { id: "explain", label: "Explain it back", icon: Sparkles },
] as const;
type Tool = (typeof TOOLS)[number]["id"];

function AskCoach() {
  const state = useStore();
  const hydrated = useHydrated();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [ctx, setCtx] = useCoachCtx();
  const { status, refresh } = useCoachStatus();
  const toolParam = params.get("tool");
  const tool: Tool = TOOLS.some((t) => t.id === toolParam) ? (toolParam as Tool) : "ask";

  const setTool = (t: Tool) => router.replace(`${pathname}?ctx=${ctx}&tool=${t}`, { scroll: false });

  // Suggested questions come from the user's own data, per module.
  const suggestions = useMemo(() => {
    if (!hydrated) return [];
    const date = today();
    const prefs = prefsOf(state);
    const left = interviewDaysLeft(prefs, date);
    if (ctx === "dsa") {
      const a = analyzeDSA(state, date, prefs, left);
      const weak = a.ranked.find((r) => r.signals.find((s) => s.key === "weakness")!.value >= 0.3);
      const strong = a.strong[0];
      return [
        weak ? `Why do I keep struggling with ${weak.patternName}?` : "Which pattern should I learn next?",
        "What should I focus on today?",
        strong ? `Am I ready for harder ${strong.patternName} problems?` : "How do I recognise a sliding window problem?",
        left !== null ? `What should I revise in the ${left} days before my interview?` : "What are my weakest areas right now?",
      ];
    }
    const a = analyzeSD(state, date, left);
    const weak = a.ranked.find((r) => r.facts.confidence > 0 && r.facts.confidence <= 2);
    return [
      weak ? `Why does ${weak.title} keep slipping for me?` : "Where should I start with system design?",
      "What should I focus on today?",
      a.focus ? `Where would ${a.focus.title} fit in a real design?` : "When should I use a message queue?",
      "What are my weakest system design areas?",
    ];
  }, [hydrated, state, ctx]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" aria-hidden /> AI Coach
          </span>
        }
        title="Ask coach"
        subtitle={ctx === "dsa" ? "Grounded in your DSA attempts, hints, failures and notes." : "Grounded in your System Design ratings, designs and interview debriefs."}
        actions={
          <>
            <CtxSwitch ctx={ctx} onChange={setCtx} />
            <ModelStatus status={status} onIndexed={refresh} />
          </>
        }
      />

      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Coach tools">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tool === t.id}
            onClick={() => setTool(t.id)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              tool === t.id ? "border-primary/40 bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <t.icon className="size-4" aria-hidden />
            {t.id === "recognize" && ctx === "sd" ? "Spot the concepts" : t.label}
          </button>
        ))}
      </div>

      {!hydrated ? (
        <Shimmer className="h-[520px] w-full rounded-xl" />
      ) : tool === "ask" ? (
        <CoachChat key={ctx} ctx={ctx} suggestions={suggestions} placeholder={ctx === "dsa" ? "Ask about your DSA preparation…" : "Ask about your System Design preparation…"} />
      ) : tool === "recognize" ? (
        <RecognizeTool key={ctx} ctx={ctx} />
      ) : tool === "hints" ? (
        <HintsTool key={ctx} ctx={ctx} initialSlug={params.get("slug") ?? undefined} initialItem={params.get("item") ?? undefined} />
      ) : (
        <ExplainTool key={ctx} ctx={ctx} initialPattern={params.get("pattern") ?? undefined} initialItem={params.get("item") ?? undefined} />
      )}
    </div>
  );
}

export default function AskCoachPage() {
  return (
    <Suspense fallback={<Shimmer className="h-[600px] w-full rounded-xl" />}>
      <AskCoach />
    </Suspense>
  );
}

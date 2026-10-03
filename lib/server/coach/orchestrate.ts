import "server-only";
import { z } from "zod";
import { buildCoachPlan } from "@/lib/coach/plan";
import { stagesFor } from "@/lib/coach/interview";
import type { CoachPlan, ModulePlan } from "@/lib/coach/types";
import { knowledgeDocs } from "../rag/knowledge";
import { retrieve, type KnowledgeHit, type RetrievalMethod } from "../rag/store";
import {
  analyses,
  dsaProblem,
  dsaProfileBlock,
  dsaRecommendationBlock,
  factsForPattern,
  factsForSD,
  mentionedPatterns,
  mentionedSDItems,
  patternFactsBlock,
  sdFactsBlock,
  sdProblem,
  sdProfileBlock,
  sdRecommendationBlock,
} from "./context";
import { askPrompt, explainPrompt, hintPrompt, interviewPrompt, knowledgeSection, planPrompt, recognizePrompt } from "./prompts";
import { getPlanDoc } from "./threads";
import type { ServerState } from "./state";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ChatRequestSchema = z.object({
  ctx: z.enum(["dsa", "sd"]),
  mode: z.enum(["plan", "ask", "recognize", "hints", "explain", "interview"]),
  date: day,
  threadId: z.string().regex(/^[a-z0-9-]{6,64}$/).optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8_000) }))
    .max(60),
  ref: z
    .object({
      slug: z.string().max(200).optional(),
      patternId: z.string().max(100).optional(),
      sdKey: z.string().max(200).optional(),
      problemText: z.string().max(6_000).optional(),
      level: z.number().int().min(1).max(4).optional(),
      stage: z.string().max(40).optional(),
      kind: z.enum(["dsa", "hld", "lld"]).optional(),
    })
    .optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export interface Prepared {
  system: string;
  sources: { title: string; href: string }[];
  retrieval: RetrievalMethod;
  temperature: number;
  maxTokens: number;
}

const byId = (id: string): KnowledgeHit | null => {
  const d = knowledgeDocs().find((x) => x.documentId === id);
  return d ? { id: d.documentId, title: d.title, href: d.href, contentType: d.contentType, content: d.content, score: 1 } : null;
};

const uniq = (hits: (KnowledgeHit | null)[]) => {
  const seen = new Set<string>();
  return hits.filter((h): h is KnowledgeHit => !!h && !seen.has(h.id) && !!seen.add(h.id));
};

const lastUser = (r: ChatRequest) => [...r.messages].reverse().find((m) => m.role === "user")?.content ?? "";

/** The saved plan for the day (or a fresh one), so the explanation matches what the user sees. */
async function planFor(state: ServerState, date: string): Promise<CoachPlan> {
  const saved = await getPlanDoc(date);
  return (saved?.plan as CoachPlan | undefined) ?? buildCoachPlan(state, date);
}

function planBlock(p: ModulePlan) {
  return [
    `TODAY'S PLAN (${p.minutes} min): ${p.actionLabel} — ${p.focusTitle}${p.priority !== null ? ` (priority ${p.priority}/100)` : ""}`,
    ...p.steps.map((s, i) => `${i + 1}. ${s.label} — ${s.minutes} min${s.detail ? `. ${s.detail}` : ""}`),
    p.after ? `After today's session: ${p.after.title}. ${p.after.reason}` : "",
    p.avoid.length ? `Avoid for now: ${p.avoid.join(" ")}` : "",
    p.stopMessage ? `STOP RULE: ${p.stopMessage}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function prepare(req: ChatRequest, state: ServerState): Promise<Prepared> {
  const { ctx, mode, date, ref = {} } = req;
  const kmod = ctx === "dsa" ? "dsa" : "system-design";
  const a = analyses(state, date);
  const question = lastUser(req);
  let hits: KnowledgeHit[] = [];
  let retrieval: RetrievalMethod = "none";
  const search = async (q: string, types?: KnowledgeHit["contentType"][], k = 3) => {
    const r = await retrieve(q, { module: kmod, contentTypes: types, k });
    retrieval = r.method;
    return r.hits;
  };

  let system: string;
  let temperature = 0.4;
  let maxTokens = 700;

  if (mode === "plan") {
    const plan = await planFor(state, date);
    const mp = ctx === "dsa" ? plan.dsa : plan.sd;
    if (!mp) throw new Error("No plan for this module today.");
    let userData: string;
    if (ctx === "dsa") {
      const an = a.dsa();
      const rec = [...an.ranked, ...an.learn].find((r) => r.patternName === mp.focusTitle);
      userData = [planBlock(mp), rec ? dsaRecommendationBlock(rec) : "", dsaProfileBlock(an)].filter(Boolean).join("\n\n");
      hits = uniq([rec ? byId(`dsa:pattern:${rec.patternId}`) : null, ...(await search(`${mp.focusTitle} ${mp.actionLabel}`, ["pattern"], 1))]);
    } else {
      const an = a.sd();
      const rec = [...an.ranked, ...an.learn].find((r) => r.title === mp.focusTitle);
      userData = [planBlock(mp), rec ? sdRecommendationBlock(rec) : "", sdProfileBlock(an)].filter(Boolean).join("\n\n");
      const key = rec?.key ?? "";
      hits = uniq([byId(`sd:${key}`), ...(await search(mp.focusTitle, undefined, 2))]);
    }
    system = planPrompt(ctx, userData, knowledgeSection(hits, 1000));
    maxTokens = 450;
  } else if (mode === "ask") {
    let userData: string;
    if (ctx === "dsa") {
      const an = a.dsa();
      const named = mentionedPatterns(question);
      const blocks = named.map((x) => factsForPattern(state, x.pattern.id, date)).filter(Boolean).map((f) => patternFactsBlock(f!));
      userData = [dsaProfileBlock(an), ...blocks, !blocks.length && an.focus ? `Current top focus:\n${dsaRecommendationBlock(an.focus)}` : ""].filter(Boolean).join("\n\n");
      hits = uniq([...named.map((x) => byId(`dsa:pattern:${x.pattern.id}`)), ...(await search(question, ["pattern", "topic"], 3))]).slice(0, 4);
    } else {
      const an = a.sd();
      const named = mentionedSDItems(question);
      const blocks = named.map((x) => factsForSD(state, x.key, date)).filter(Boolean).map((f) => sdFactsBlock(f!));
      userData = [sdProfileBlock(an), ...blocks, !blocks.length && an.focus ? `Current top focus:\n${sdRecommendationBlock(an.focus)}` : ""].filter(Boolean).join("\n\n");
      hits = uniq([...named.map((x) => byId(`sd:${x.key}`)), ...(await search(question, undefined, 3))]).slice(0, 4);
    }
    system = askPrompt(ctx, userData, knowledgeSection(hits, 1100));
  } else if (mode === "recognize") {
    const text = ref.problemText || question;
    hits = await search(text, ctx === "dsa" ? ["pattern"] : ["concept", "design-pattern"], 4);
    system = recognizePrompt(ctx, knowledgeSection(hits, 900), text);
    temperature = 0.3;
  } else if (mode === "hints") {
    const level = ref.level ?? 1;
    let problem = ref.problemText ?? "";
    if (ctx === "dsa" && ref.slug) {
      const p = dsaProblem(ref.slug, state);
      if (p) {
        problem = `LeetCode "${p.title}" (${p.difficulty}). ${problem}`.trim();
        hits = uniq([byId(`dsa:pattern:${p.pattern.id}`)]);
      }
    } else if (ctx === "sd" && ref.sdKey) {
      const p = sdProblem(ref.sdKey, state);
      if (p) {
        problem = `${p.title}\n${p.text}`;
        hits = uniq(p.concepts.slice(0, 2).map((c) => byId(`sd:concept:${c}`)));
      }
    }
    if (!hits.length && problem) hits = await search(problem, ctx === "dsa" ? ["pattern"] : undefined, 2);
    system = hintPrompt(ctx, level, problem || "(the user will describe the problem)", knowledgeSection(hits, 1400));
    temperature = 0.3;
    maxTokens = 350;
  } else if (mode === "explain") {
    let subject = "the topic";
    let userData = "";
    if (ctx === "dsa" && ref.patternId) {
      const f = factsForPattern(state, ref.patternId, date);
      subject = f?.patternName ?? ref.patternId;
      userData = f ? patternFactsBlock(f) : "";
      hits = uniq([byId(`dsa:pattern:${ref.patternId}`)]);
    } else if (ctx === "sd" && ref.sdKey) {
      const f = factsForSD(state, ref.sdKey, date);
      subject = f?.title ?? ref.sdKey;
      userData = f ? sdFactsBlock(f) : "";
      hits = uniq([byId(`sd:${ref.sdKey}`)]);
    }
    if (!hits.length) hits = await search(question, undefined, 2);
    system = explainPrompt(ctx, subject, userData || "(no history for this item)", knowledgeSection(hits, 1600));
    temperature = 0.3;
    maxTokens = 450;
  } else {
    // interview
    const kind = ref.kind ?? (ctx === "dsa" ? "dsa" : "hld");
    const stages = stagesFor(kind);
    const stage = stages.find((s) => s.id === ref.stage) ?? stages[0];
    let problem = ref.problemText ?? "";
    let probe = "";
    if (kind === "dsa" && ref.slug) {
      const p = dsaProblem(ref.slug, state);
      if (p) {
        problem = `LeetCode "${p.title}" (${p.difficulty}). The intended pattern is ${p.pattern.name}; it teaches: ${p.takeaway}. Keep the pattern secret. If you don't remember the exact statement, describe it at a high level and ask the candidate to restate it from the problem page.${problem ? `\nCandidate-provided statement: ${problem}` : ""}`;
        hits = uniq([byId(`dsa:pattern:${p.pattern.id}`)]);
        const f = factsForPattern(state, p.pattern.id, date);
        if (f && (f.recentFails || f.recentHints || (f.avgConfidence ?? 5) < 3)) {
          probe = `they have struggled with ${f.patternName} recently (${f.recentFails} failed, ${f.recentHints} with hints in 21 days). Check that they can justify the invariant.`;
        }
      }
    } else if (kind !== "dsa" && ref.sdKey) {
      const p = sdProblem(ref.sdKey, state);
      if (p) {
        problem = `${p.title}\n${p.text}\nDeep dives you may ask about: ${p.deepDives.join("; ")}`;
        hits = uniq(p.concepts.slice(0, 2).map((c) => byId(`sd:concept:${c}`)));
        const weak = a.sd().ranked.filter((r) => r.kind !== "problem" && r.facts.confidence > 0 && r.facts.confidence <= 2).slice(0, 2);
        if (weak.length) probe = `they rated ${weak.map((w) => w.title).join(" and ")} low; probe those if relevant to this design.`;
      }
    }
    system = interviewPrompt({ ctx, kind, problem: problem || "(the candidate provides it)", stage, stages, probe, knowledge: knowledgeSection(hits, 900) });
    temperature = 0.5;
    maxTokens = stage.id === "feedback" ? 650 : 260;
  }

  return { system, sources: hits.map((h) => ({ title: h.title, href: h.href })), retrieval, temperature, maxTokens };
}


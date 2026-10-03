import type { NextRequest } from "next/server";
import { chatModel } from "@/lib/ai";
import { AIUnavailableError } from "@/lib/ai/types";
import { ChatRequestSchema, prepare } from "@/lib/server/coach/orchestrate";
import { loadUserState } from "@/lib/server/coach/state";
import { savePlanExplanation, saveThread } from "@/lib/server/coach/threads";
import { isAuthed, isJson, json, serverError } from "@/lib/server/http";

export const maxDuration = 120;

/**
 * Streams a coach reply as plain text. The user's facts are recomputed here from MongoDB;
 * the request only says which module, which tool and what the user typed.
 */
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return json({ error: "Unauthorized" }, 401);
  if (!isJson(req)) return json({ error: "Expected JSON" }, 415);
  const parsed = ChatRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid request", issues: parsed.error.issues.slice(0, 5) }, 400);
  const body = parsed.data;

  let prepared;
  try {
    prepared = await prepare(body, await loadUserState());
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("No plan")) return json({ error: err.message }, 409);
    return serverError(err);
  }

  const model = chatModel();
  const messages = [{ role: "system" as const, content: prepared.system }, ...body.messages.slice(-16)];
  if (messages.length === 1) messages.push({ role: "user", content: body.mode === "plan" ? "Explain today's plan." : "Let's begin." });

  const encoder = new TextEncoder();
  let full = "";
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of model.stream(messages, { temperature: prepared.temperature, maxTokens: prepared.maxTokens, signal: req.signal })) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        if (req.signal.aborted) return controller.close();
        const msg = err instanceof AIUnavailableError ? err.message : "The coach model failed to respond.";
        console.error("[coach]", err);
        controller.enqueue(encoder.encode(`\n\n[coach-error] ${msg}`));
        controller.close();
        return;
      }
      // Persist after a complete reply (private user data).
      try {
        if (body.mode === "plan") await savePlanExplanation(body.date, body.ctx, full);
        else if (body.threadId) {
          const now = new Date().toISOString();
          const firstUser = body.messages.find((m) => m.role === "user")?.content ?? body.mode;
          await saveThread({
            _id: body.threadId,
            ctx: body.ctx,
            mode: body.mode,
            title: firstUser.replace(/\s+/g, " ").slice(0, 80),
            ref: body.ref,
            messages: [...body.messages.map((m) => ({ ...m, at: now })), { role: "assistant", content: full, at: now }],
          });
        }
      } catch (err) {
        console.error("[coach] save failed", err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Coach-Model": encodeURIComponent(`${model.provider}:${model.model}`),
      "X-Coach-Retrieval": prepared.retrieval,
      "X-Coach-Sources": encodeURIComponent(JSON.stringify(prepared.sources)),
    },
  });
}

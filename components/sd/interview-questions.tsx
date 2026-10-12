import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import type { InterviewQA } from "@/data/sd/types";

/** Interview questions; ones with an answer open as a dropdown so you can try first, then check. */
export function InterviewQuestions({ items }: { items: (string | InterviewQA)[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        if (typeof item === "string") {
          return (
            <li key={item} className="flex gap-2.5 rounded-lg border bg-surface px-3 py-2.5 text-sm">
              <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {item}
            </li>
          );
        }
        return (
          <li key={item.q}>
            <details className="group rounded-lg border bg-surface">
              <summary className="flex cursor-pointer list-none items-start gap-2.5 px-3 py-2.5 text-sm outline-none hover:bg-muted/40 focus-visible:bg-muted">
                <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">{item.q}</span>
                <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="border-t px-3 py-2.5 pl-9 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

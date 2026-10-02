"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { blankEntry, logAttempt, reviewInterval, useProgress, type AttemptResult } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const CONFIDENCE_LABEL = ["Not rated", "Lost", "Shaky", "OK with hints", "Solid", "Could teach it"];

const RESULTS: { value: AttemptResult; label: string; hint: string }[] = [
  { value: "solved", label: "Solved", hint: "On my own" },
  { value: "hints", label: "With hints", hint: "Needed a nudge" },
  { value: "failed", label: "Couldn't solve", hint: "Schedules a retry tomorrow" },
];

interface Props {
  slug: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  durationSec?: number;
  onLogged?: () => void;
}

export function LogAttemptDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Content unmounts on close, so the form starts fresh each time. */}
        <LogForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function LogForm({ slug, title, onOpenChange, durationSec, onLogged }: Props) {
  const entry = useProgress()[slug] ?? blankEntry();
  const [result, setResult] = useState<AttemptResult>("solved");
  const [confidence, setConfidence] = useState(entry.understanding || 3);
  const [minutes, setMinutes] = useState(durationSec ? String(Math.max(1, Math.round(durationSec / 60))) : "");
  const [note, setNote] = useState("");

  const isRevision = entry.solveCount > 0;
  const failed = result === "failed";
  const nextDays = failed ? 1 : reviewInterval(confidence, entry.revisitCount + (isRevision ? 1 : 0));

  const save = () => {
    const mins = Number(minutes);
    logAttempt(
      slug,
      {
        result,
        confidence: failed ? 1 : confidence,
        durationSec: Number.isFinite(mins) && mins > 0 ? Math.round(mins * 60) : durationSec,
        note,
      },
      title,
    );
    toast.success(failed ? "Logged. It's queued for tomorrow." : isRevision ? "Revision logged" : "Nice — solve logged", {
      description: `Next review in ${nextDays} day${nextDays === 1 ? "" : "s"}.`,
    });
    setNote("");
    onOpenChange(false);
    onLogged?.();
  };

  return (
    <>
        <DialogHeader>
          <DialogTitle>{isRevision ? "Log a revision" : "Log your solve"}</DialogTitle>
          <DialogDescription className="truncate">{title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted-foreground">How did it go?</legend>
            <div className="grid grid-cols-3 gap-2">
              {RESULTS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={result === r.value}
                  onClick={() => setResult(r.value)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    result === r.value
                      ? r.value === "failed"
                        ? "border-destructive/50 bg-destructive/10"
                        : "border-primary/60 bg-primary/10"
                      : "hover:bg-muted",
                  )}
                >
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{r.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {!failed && (
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-muted-foreground">
                Confidence — could you solve a variation cold?
              </legend>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={confidence === n}
                    aria-label={`${n} — ${CONFIDENCE_LABEL[n]}`}
                    onClick={() => setConfidence(n)}
                    className={cn(
                      "size-9 rounded-lg border font-mono text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring",
                      n <= confidence ? "border-primary/50 bg-primary text-primary-foreground" : "hover:bg-muted",
                      n === confidence && "animate-pop",
                    )}
                  >
                    {n}
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">{CONFIDENCE_LABEL[confidence]}</span>
              </div>
            </fieldset>
          )}

          <div className="grid grid-cols-[110px_1fr] items-start gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="log-min" className="text-xs text-muted-foreground">
                Minutes
              </Label>
              <Input
                id="log-min"
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="—"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="log-note" className="text-xs text-muted-foreground">
                Note for this attempt
              </Label>
              <Textarea
                id="log-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={failed ? "Where did I get stuck?" : "What clicked this time?"}
              />
            </div>
          </div>

          <p className="rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            next review → in {nextDays} day{nextDays === 1 ? "" : "s"}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save attempt</Button>
        </DialogFooter>
    </>
  );
}

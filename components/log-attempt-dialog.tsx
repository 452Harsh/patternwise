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

const DAY_PRESETS = [1, 3, 7, 14, 30];


const RESULTS: { value: AttemptResult; label: string; hint: string }[] = [
  { value: "solved", label: "Solved", hint: "On my own" },
  { value: "hints", label: "With hints", hint: "Needed a nudge" },
  { value: "failed", label: "Couldn't solve", hint: "Not solved yet" },
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
  const [minutes, setMinutes] = useState(durationSec ? String(Math.max(1, Math.round(durationSec / 60))) : "");
  const [note, setNote] = useState("");
  const [revise, setRevise] = useState(entry.revisit);
  /** Empty = use the default interval. */
  const [days, setDays] = useState("");

  const isRevision = entry.solveCount > 0;
  const failed = result === "failed";
  const suggestedDays = failed ? 1 : reviewInterval(3, entry.revisitCount + (isRevision ? 1 : 0));
  const nextDays = Number(days) >= 1 ? Math.round(Number(days)) : suggestedDays;

  const save = () => {
    const mins = Number(minutes);
    logAttempt(
      slug,
      {
        result,
        confidence: failed ? 1 : 3,
        durationSec: Number.isFinite(mins) && mins > 0 ? Math.round(mins * 60) : durationSec,
        note,
        revise,
        reviewInDays: nextDays,
      },
      title,
    );
    toast.success(failed ? "Attempt logged" : isRevision ? "Revision logged" : "Nice — marked as solved", {
      description: revise ? `In revision · next review in ${nextDays} day${nextDays === 1 ? "" : "s"}.` : "Not added to revision.",
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

          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-muted px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={revise}
              onChange={(e) => setRevise(e.target.checked)}
              className="size-4 accent-primary"
            />
            <span>Add to revision</span>
            {revise && (
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                next review → in {nextDays} day{nextDays === 1 ? "" : "s"}
              </span>
            )}
          </label>

          {revise && (
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-muted-foreground">Review again in</legend>
              <div className="flex flex-wrap items-center gap-1.5">
                {DAY_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={nextDays === d}
                    onClick={() => setDays(String(d))}
                    className={cn(
                      "h-8 rounded-lg border px-2.5 font-mono text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                      nextDays === d ? "border-primary/50 bg-primary text-primary-foreground" : "hover:bg-muted",
                    )}
                  >
                    {d}d
                  </button>
                ))}
                <Input
                  aria-label="Custom number of days"
                  inputMode="numeric"
                  value={days}
                  onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))}
                  placeholder={String(suggestedDays)}
                  className="h-8 w-16 font-mono"
                />
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            </fieldset>
          )}
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

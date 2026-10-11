"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addToRevision, blankEntry, daysBetween, removeFromRevision, today, useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

const DAY_PRESETS = [1, 3, 7, 14, 30];

interface Props {
  slug: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Add a problem to revision (or edit it): what to revise, and in how many days. */
export function RevisionDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Content unmounts on close, so the form starts fresh each time. */}
        <RevisionForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function RevisionForm({ slug, title, onOpenChange }: Props) {
  const entry = useProgress()[slug] ?? blankEntry();
  const editing = entry.revisit;
  const [note, setNote] = useState(entry.revisionNote ?? "");
  const [days, setDays] = useState(() =>
    String(editing && entry.nextReview ? Math.max(1, daysBetween(today(), entry.nextReview)) : 3),
  );
  const n = Math.max(1, Math.round(Number(days) || 1));

  const save = () => {
    addToRevision(slug, note, n, title);
    toast.success(editing ? "Revision updated" : "Added to revision", {
      description: `Review in ${n} day${n === 1 ? "" : "s"}.`,
    });
    onOpenChange(false);
  };

  const remove = () => {
    removeFromRevision(slug);
    toast("Removed from revision");
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit revision" : "Add to revision"}</DialogTitle>
        <DialogDescription className="truncate">{title}</DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="rev-note" className="text-xs text-muted-foreground">
            What do I need to revise?
          </Label>
          <Textarea
            id="rev-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            autoFocus
            placeholder="e.g. the trick for handling duplicates, the edge case with an empty array…"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-medium text-muted-foreground">Review again in</legend>
          <div className="flex flex-wrap items-center gap-1.5">
            {DAY_PRESETS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={n === d}
                onClick={() => setDays(String(d))}
                className={cn(
                  "h-8 rounded-lg border px-2.5 font-mono text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  n === d ? "border-primary/50 bg-primary text-primary-foreground" : "hover:bg-muted",
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
              className="h-8 w-16 font-mono"
            />
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        </fieldset>
      </div>

      <DialogFooter className="sm:justify-between">
        {editing ? (
          <Button variant="ghost" className="text-destructive" onClick={remove}>
            Remove from revision
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{editing ? "Save" : "Add to revision"}</Button>
        </div>
      </DialogFooter>
    </>
  );
}

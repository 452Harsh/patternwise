"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { topics } from "@/data/curriculum";
import type { Difficulty } from "@/data/types";
import { addCustomProblem } from "@/lib/progress";

const PLATFORMS = ["LeetCode", "Codeforces", "GeeksforGeeks", "HackerRank", "InterviewBit", "AlgoExpert", "Other"];

export function AddProblemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <AddProblemForm onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AddProblemForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("LeetCode");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [patternId, setPatternId] = useState(topics[0].patterns[0].id);
  const [takeaway, setTakeaway] = useState("");

  const valid = title.trim().length > 1 && (!url || /^https?:\/\//.test(url));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const slug = addCustomProblem({
      title: title.trim(),
      url: url.trim(),
      platform,
      difficulty,
      patternId,
      takeaway: takeaway.trim() || "My own problem",
    });
    toast.success("Problem added", { description: title.trim() });
    onDone();
    router.push(`/problems/${slug}`);
  };

  return (
    <form onSubmit={submit} className="contents">
      <DialogHeader>
        <DialogTitle>Add a problem</DialogTitle>
        <DialogDescription>Track a problem from any platform and attach it to a pattern.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="np-title">Title</Label>
          <Input id="np-title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus placeholder="e.g. Minimum Window Subsequence" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="np-url">Link</Label>
          <Input id="np-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="np-platform">Platform</Label>
            <NativeSelect id="np-platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="np-diff">Difficulty</Label>
            <NativeSelect id="np-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </NativeSelect>
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="np-pattern">Pattern</Label>
          <NativeSelect id="np-pattern" value={patternId} onChange={(e) => setPatternId(e.target.value)}>
            {topics.map((t) => (
              <optgroup key={t.id} label={t.name}>
                {t.patterns.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="np-take">Key idea (optional)</Label>
          <Input id="np-take" value={takeaway} onChange={(e) => setTakeaway(e.target.value)} placeholder="The one-line insight" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid}>
          Add problem
        </Button>
      </DialogFooter>
    </form>
  );
}

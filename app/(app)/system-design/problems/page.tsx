"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageHeader } from "@/components/kit";
import { NativeSelect } from "@/components/native-select";
import { SDItemList } from "@/components/sd/sd-kit";
import { addSDCustom, isSDDue, useStore } from "@/lib/progress";
import { isPracticed, useSDItems } from "@/lib/sd";

function AddForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [track, setTrack] = useState<"hld" | "lld">("hld");
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [statement, setStatement] = useState("");
  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        const id = addSDCustom({ track, title: title.trim(), difficulty, statement: statement.trim() || "My own design problem." });
        toast.success("Problem added", { description: title.trim() });
        onDone();
        router.push(`/system-design/problems/${id}`);
      }}
    >
      <DialogHeader>
        <DialogTitle>Add a design problem</DialogTitle>
        <DialogDescription>It gets the full HLD or LLD workspace, revision and notes.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="sp-track">Type</Label>
            <NativeSelect id="sp-track" value={track} onChange={(e) => setTrack(e.target.value as "hld" | "lld")}>
              <option value="hld">HLD (system design)</option>
              <option value="lld">LLD (object design)</option>
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sp-diff">Difficulty</Label>
            <NativeSelect id="sp-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </NativeSelect>
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="sp-title">Title</Label>
          <Input id="sp-title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus placeholder={track === "hld" ? "Design a web crawler" : "Design an online auction"} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="sp-statement">Problem statement</Label>
          <Textarea id="sp-statement" value={statement} onChange={(e) => setStatement(e.target.value)} rows={3} placeholder="What should the system do? Any scale or constraints?" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim()}>
          Add problem
        </Button>
      </DialogFooter>
    </form>
  );
}

function ProblemsInner() {
  const params = useSearchParams();
  const state = useStore();
  const items = useSDItems();
  const [q, setQ] = useState("");
  const [track, setTrack] = useState(params.get("track") ?? "all");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const [adding, setAdding] = useState(params.get("add") === "1");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((x) => {
      if (x.kind !== "problem") return false;
      const e = state.sd[x.key];
      if (needle && !`${x.title} ${x.summary}`.toLowerCase().includes(needle)) return false;
      if (track !== "all" && x.track !== track) return false;
      if (difficulty !== "all" && x.difficulty !== difficulty) return false;
      if (status === "todo" && e?.history.length) return false;
      if (status === "practiced" && !isPracticed(e)) return false;
      if (status === "due" && !isSDDue(e)) return false;
      if (status === "mine" && !x.id.startsWith("sdc-")) return false;
      return true;
    });
  }, [items, state.sd, q, track, difficulty, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System Design"
        title="Design problems"
        subtitle="HLD system-design exercises and LLD machine-coding problems, each with a structured workspace."
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus data-icon="inline-start" /> Add problem
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search problems…" aria-label="Search problems" className="w-full sm:w-72" />
        <NativeSelect aria-label="Type" value={track} onChange={(e) => setTrack(e.target.value)}>
          <option value="all">HLD + LLD</option>
          <option value="hld">HLD</option>
          <option value="lld">LLD</option>
        </NativeSelect>
        <NativeSelect aria-label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="all">Any difficulty</option>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </NativeSelect>
        <NativeSelect aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Any status</option>
          <option value="todo">Not started</option>
          <option value="practiced">Practiced</option>
          <option value="due">Due for review</option>
          <option value="mine">My problems</option>
        </NativeSelect>
        <span className="text-sm text-muted-foreground">
          <span className="font-mono text-foreground">{rows.length}</span> problems
        </span>
      </div>
      <SDItemList
        items={rows}
        empty={
          <EmptyState
            icon={SearchX}
            title="No problems match"
            description="Try another filter, or add your own problem."
            action={
              <Button size="sm" onClick={() => setAdding(true)}>
                Add problem
              </Button>
            }
          />
        }
      />
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-lg">
          <AddForm onDone={() => setAdding(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SDProblemsPage() {
  return (
    <Suspense>
      <ProblemsInner />
    </Suspense>
  );
}

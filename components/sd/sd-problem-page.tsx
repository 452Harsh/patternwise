"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FileQuestion, Timer, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DifficultyBadge, EmptyState, Shimmer } from "@/components/kit";
import { findProblem, sdKey } from "@/data/sd";
import { removeSDCustom, useHydrated, useStore } from "@/lib/progress";
import { HLDWorkspace, HLD_SECTIONS } from "./hld-workspace";
import { LLDWorkspace, LLD_SECTIONS } from "./lld-workspace";
import { ReviewButtons, SDNotes, SDProgressCard, SDStatusBadge, StarToggle, TrackTag } from "./sd-kit";

export function SDProblemPage({ id }: { id: string }) {
  const state = useStore();
  const hydrated = useHydrated();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);

  const curated = findProblem(id);
  const custom = state.sdCustom.find((c) => c.id === id);

  if (!curated && !hydrated) return <Shimmer className="h-96 w-full rounded-xl" />;
  if (!curated && !custom) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Problem not found"
        description="It may have been a custom problem that was deleted."
        action={
          <Link href="/system-design/problems" className={buttonVariants({ size: "sm" })}>
            Back to problems
          </Link>
        }
      />
    );
  }

  const track = curated?.track ?? custom!.track;
  const title = curated?.problem.title ?? custom!.title;
  const difficulty = curated?.problem.difficulty ?? custom!.difficulty;
  const key = sdKey("problem", id);
  const sections = track === "hld" ? HLD_SECTIONS : LLD_SECTIONS;

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/system-design/problems" className="hover:text-foreground">
            Problems
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/system-design/${track}`} className="hover:text-foreground">
            {track.toUpperCase()}
          </Link>
        </nav>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <TrackTag track={track} />
              <DifficultyBadge difficulty={difficulty} />
              <SDStatusBadge entry={state.sd[key]} />
              {custom && <span className="text-xs text-muted-foreground">· your problem</span>}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/system-design/interview?item=${encodeURIComponent(key)}`} className={buttonVariants({ variant: "secondary" })}>
              <Timer data-icon="inline-start" /> Timed session
            </Link>
            <StarToggle itemKey={key} title={title} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-10">
          <nav aria-label="Sections" className="flex gap-1 overflow-x-auto pb-1 lg:hidden">
            {sections.map(([sid, label]) => (
              <a key={sid} href={`#${sid}`} className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
          {track === "hld" ? (
            <HLDWorkspace itemKey={key} title={title} problem={curated?.track === "hld" ? curated.problem : undefined} customStatement={custom?.statement} />
          ) : (
            <LLDWorkspace itemKey={key} title={title} problem={curated?.track === "lld" ? curated.problem : undefined} customStatement={custom?.statement} />
          )}
          <section aria-labelledby="notes-h">
            <h2 id="notes-h" className="mb-3 text-sm font-semibold tracking-tight">
              My notes
            </h2>
            <SDNotes itemKey={key} title={title} placeholder="What would you do differently next time?" />
          </section>
          {custom && (
            <div className="border-t pt-6">
              <Button variant="destructive" size="sm" onClick={() => setConfirm(true)}>
                <Trash2 data-icon="inline-start" /> Delete this problem
              </Button>
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start" aria-label="Progress on this problem">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Mark as practiced</p>
            <p className="text-xs text-muted-foreground">How did your design hold up? This schedules the next attempt.</p>
            <ReviewButtons itemKey={key} title={title} kind="practice" size="sm" />
          </div>
          <SDProgressCard itemKey={key} />
          <nav aria-label="On this page" className="hidden lg:block">
            <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">On this page</p>
            <ul className="space-y-0.5">
              {sections.map(([sid, label]) => (
                <li key={sid}>
                  <a href={`#${sid}`} className="block rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
            <AlertDialogDescription>Its workspace and notes are removed. Linked diagrams stay in Architecture.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                removeSDCustom(id);
                toast("Problem deleted");
                router.push("/system-design/problems");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

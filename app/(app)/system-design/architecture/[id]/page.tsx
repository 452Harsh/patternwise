"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Workflow } from "lucide-react";
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
import { EmptyState, Shimmer } from "@/components/kit";
import { ArchitectureEditor } from "@/components/sd/architecture-editor";
import { CompleteButton, SDNotes, SDRevisionButton } from "@/components/sd/sd-kit";
import { SD_INDEX, sdKey } from "@/data/sd";
import { deleteDiagram, useHydrated, useStore } from "@/lib/progress";

export default function DiagramPage() {
  const { id } = useParams<{ id: string }>();
  const state = useStore();
  const hydrated = useHydrated();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);

  if (!hydrated) return <Shimmer className="h-[600px] w-full rounded-xl" />;
  const diagram = state.diagrams[id];
  if (!diagram) {
    return (
      <EmptyState
        icon={Workflow}
        title="Diagram not found"
        description="It may have been deleted."
        action={
          <Link href="/system-design/architecture" className={buttonVariants({ size: "sm" })}>
            Back to Architecture
          </Link>
        }
      />
    );
  }
  const problem = diagram.problemKey ? SD_INDEX.get(diagram.problemKey) : undefined;
  const key = sdKey("diagram", id);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/system-design/architecture" className="hover:text-foreground">
              Architecture
            </Link>
            {problem && (
              <>
                <span aria-hidden>/</span>
                <Link href={problem.href} className="hover:text-foreground">
                  {problem.title}
                </Link>
              </>
            )}
          </nav>
          <h1 className="truncate text-2xl font-semibold tracking-tight">{diagram.title}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}>
          <Trash2 data-icon="inline-start" /> Delete diagram
        </Button>
      </header>

      <ArchitectureEditor diagramId={id} height={620} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold">Review this diagram</h2>
          <p className="mb-3 text-xs text-muted-foreground">Could you redraw it from memory and explain every arrow?</p>
          <div className="flex flex-wrap items-center gap-2">
            <CompleteButton itemKey={key} title={diagram.title} />
            <SDRevisionButton itemKey={key} title={diagram.title} />
          </div>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-semibold">Notes</h2>
          <SDNotes itemKey={key} title={diagram.title} rows={4} placeholder="What would you change at 10× scale?" />
        </section>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{diagram.title}”?</AlertDialogTitle>
            <AlertDialogDescription>The diagram and its review history are removed. This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                deleteDiagram(id);
                toast("Diagram deleted");
                router.push("/system-design/architecture");
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

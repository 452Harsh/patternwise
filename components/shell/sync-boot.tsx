"use client";

import { useEffect } from "react";
import { Cloud, CloudOff, Loader2, TriangleAlert } from "lucide-react";
import { initRemote, useSyncStatus } from "@/lib/progress";
import { cn } from "@/lib/utils";

/** Kicks off the initial load from the server; shows a banner while offline. */
export function SyncBoot() {
  const status = useSyncStatus();
  useEffect(() => {
    initRemote();
  }, []);

  if (status !== "offline") return null;
  return (
    <div role="status" className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-warning/15 px-4 py-1.5 text-xs text-warning backdrop-blur">
      <CloudOff className="size-3.5" aria-hidden />
      Can&apos;t reach the database. Showing your last local copy; changes will sync when the connection returns.
    </div>
  );
}

const META = {
  idle: { icon: Loader2, label: "Connecting…", tone: "text-muted-foreground", spin: true },
  loading: { icon: Loader2, label: "Loading…", tone: "text-muted-foreground", spin: true },
  saving: { icon: Loader2, label: "Saving…", tone: "text-muted-foreground", spin: true },
  ready: { icon: Cloud, label: "Saved", tone: "text-muted-foreground", spin: false },
  error: { icon: TriangleAlert, label: "Save failed — retrying", tone: "text-warning", spin: false },
  offline: { icon: CloudOff, label: "Offline", tone: "text-warning", spin: false },
} as const;

export function SyncIndicator({ showLabel = true, className }: { showLabel?: boolean; className?: string }) {
  const status = useSyncStatus();
  const m = META[status];
  const Icon = m.icon;
  return (
    <span role="status" aria-live="polite" title={m.label} className={cn("inline-flex items-center gap-1.5 text-xs", m.tone, className)}>
      <Icon className={cn("size-3.5 shrink-0", m.spin && "animate-spin")} aria-hidden />
      <span className={cn(!showLabel && "sr-only")}>{m.label}</span>
    </span>
  );
}

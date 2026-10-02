"use client";

import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Download, Keyboard, LogOut, Moon, Sun, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Kbd, PageHeader, Panel, SectionTitle, Shimmer } from "@/components/kit";
import { NativeSelect } from "@/components/native-select";
import { NAV } from "@/components/shell/nav";
import { SyncIndicator } from "@/components/shell/sync-boot";
import { exportJson, importJson, logout, resetAll, updateSettings, useHydrated, useStore } from "@/lib/progress";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const state = useStore();
  const hydrated = useHydrated();
  const { resolvedTheme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportJson()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `patternwise-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const doImport = async () => {
    if (!pending) return;
    try {
      const n = importJson(await pending.text());
      toast.success(`Imported progress for ${n} problems`);
    } catch (err) {
      toast.error("Import failed", { description: err instanceof Error ? err.message : "Invalid file" });
    }
    setPending(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (!hydrated) return <Shimmer className="h-96 w-full rounded-xl" />;

  return (
    <div className="max-w-3xl space-y-10">
      <PageHeader title="Settings" subtitle="Profile, study preferences, appearance and your data." />

      <section>
        <SectionTitle>Profile</SectionTitle>
        <Panel className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="s-name">Display name</Label>
            <Input id="s-name" value={state.settings.name} onChange={(e) => updateSettings({ name: e.target.value })} placeholder="Used in your greeting" />
          </div>
        </Panel>
      </section>

      <section>
        <SectionTitle>Study preferences</SectionTitle>
        <Panel className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="s-daily">New problems per day</Label>
            <NativeSelect id="s-daily" value={state.settings.dailyNew} onChange={(e) => updateSettings({ dailyNew: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">Applies from tomorrow&apos;s plan (or regenerate today&apos;s on Study Plan).</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-mocks">Mock interview target</Label>
            <NativeSelect id="s-mocks" value={state.settings.mockTarget} onChange={(e) => updateSettings({ mockTarget: Number(e.target.value) })}>
              {[3, 5, 8, 10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </NativeSelect>
          </div>
        </Panel>
      </section>

      <section>
        <SectionTitle>Appearance</SectionTitle>
        <Panel className="flex flex-wrap gap-2 p-5" role="radiogroup" aria-label="Theme">
          {(
            [
              ["dark", "Dark", Moon],
              ["light", "Light", Sun],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={resolvedTheme === value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex h-16 w-36 items-center gap-3 rounded-xl border px-4 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                resolvedTheme === value ? "border-primary/50 bg-primary/10" : "hover:bg-muted",
              )}
            >
              <Icon className="size-4" aria-hidden /> {label}
            </button>
          ))}
        </Panel>
      </section>

      <section>
        <SectionTitle hint="Press ? anywhere to see these.">
          <span className="inline-flex items-center gap-2">
            <Keyboard className="size-4" aria-hidden /> Keyboard shortcuts
          </span>
        </SectionTitle>
        <Panel className="grid grid-cols-1 gap-x-8 gap-y-2 p-5 text-sm sm:grid-cols-2">
          <div className="flex items-center justify-between">
            Search everything
            <span className="flex gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </div>
          {NAV.map((n) => (
            <div key={n.href} className="flex items-center justify-between">
              {n.label}
              <span className="flex gap-1">
                <Kbd>G</Kbd>
                <Kbd>{n.key.toUpperCase()}</Kbd>
              </span>
            </div>
          ))}
        </Panel>
      </section>

      <section>
        <SectionTitle hint="Saved to your MongoDB database automatically. Exports are a JSON snapshot you can keep as a backup." action={<SyncIndicator />}>Your data</SectionTitle>
        <Panel className="flex flex-wrap gap-2 p-5">
          <Button variant="secondary" onClick={download}>
            <Download data-icon="inline-start" /> Export backup
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload data-icon="inline-start" /> Import backup
          </Button>
          <Button variant="outline" onClick={logout}>
            <LogOut data-icon="inline-start" /> Sign out
          </Button>
          <Button variant="destructive" onClick={() => setConfirmReset(true)} className="sm:ml-auto">
            Reset all progress
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => setPending(e.target.files?.[0] ?? null)}
          />
        </Panel>
      </section>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your progress?</AlertDialogTitle>
            <AlertDialogDescription>
              Importing “{pending?.name}” replaces everything in your database. Export a backup first if unsure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doImport}>Import</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all progress?</AlertDialogTitle>
            <AlertDialogDescription>
              Solves, notes, solutions, schedules, company lists and mocks will be deleted from the database. Your name and preferences stay. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                resetAll();
                toast("Progress reset");
              }}
            >
              Reset everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

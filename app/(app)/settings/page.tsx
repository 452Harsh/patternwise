"use client";

import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  DatabaseBackup,
  Download,
  Keyboard,
  LogOut,
  Moon,
  Palette,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Sun,
  Upload,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Kbd, PageHeader, Panel, Shimmer } from "@/components/kit";
import { NativeSelect } from "@/components/native-select";
import { MODULE_LIST, navItems } from "@/components/shell/nav";
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

  const selectCell = "flex h-full flex-col gap-1.5 rounded-xl border bg-surface p-4";

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Profile, study preferences, appearance and your data." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SettingsCard icon={UserRound} title="Profile" description="How the app greets you.">
          <div className="grid gap-1.5">
            <Label htmlFor="s-name">Display name</Label>
            <Input id="s-name" value={state.settings.name} onChange={(e) => updateSettings({ name: e.target.value })} placeholder="Used in your greeting" />
          </div>
        </SettingsCard>

        <SettingsCard icon={Palette} title="Appearance" description="Dark is the default; light is there when you need it.">
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Theme">
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
                  "flex h-9 items-center justify-center gap-2 rounded-lg border text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  resolvedTheme === value ? "border-primary/50 bg-primary/10 font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden /> {label}
              </button>
            ))}
          </div>
        </SettingsCard>
      </div>

      <SettingsCard icon={SlidersHorizontal} title="Study preferences" description="How your daily plans and reviews are generated.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className={selectCell}>
            <Label htmlFor="s-daily">New DSA problems per day</Label>
            <NativeSelect id="s-daily" value={state.settings.dailyNew} onChange={(e) => updateSettings({ dailyNew: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">Applies from tomorrow&apos;s plan, or regenerate today&apos;s.</p>
          </div>
          <div className={selectCell}>
            <Label htmlFor="s-mocks">Mock interview target</Label>
            <NativeSelect id="s-mocks" value={state.settings.mockTarget} onChange={(e) => updateSettings({ mockTarget: Number(e.target.value) })}>
              {[3, 5, 8, 10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">Counts toward DSA preparation and readiness.</p>
          </div>
          <div className={selectCell}>
            <span className="text-sm leading-none font-medium">System Design reviews</span>
            <label className="flex h-8 cursor-pointer items-center gap-2.5 rounded-lg border border-input px-2.5 text-sm dark:bg-input/30">
              <Checkbox checked={state.settings.sdAutoReview} onCheckedChange={(v) => updateSettings({ sdAutoReview: v === true })} />
              Schedule when I mark complete
            </label>
            <p className="text-xs text-muted-foreground">Off: completing adds nothing to Revision. Per-item stop/resume still works.</p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard icon={Keyboard} title="Keyboard shortcuts" description="Shortcuts follow the module you're in. Press ? anywhere to see them.">
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border bg-surface px-3 py-2">
            Search the current module
            <span className="flex gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-surface px-3 py-2">
            Switch module
            <span className="flex items-center gap-1">
              <Kbd>G</Kbd>
              <Kbd>1</Kbd>
              <span className="mx-1 text-muted-foreground">/</span>
              <Kbd>G</Kbd>
              <Kbd>2</Kbd>
            </span>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-6 text-sm md:grid-cols-2">
          {MODULE_LIST.map((m) => (
            <div key={m.id}>
              <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <ul className="space-y-1.5">
                {navItems(m.id)
                  .filter((n) => n.key)
                  .map((n) => (
                    <li key={n.href} className="flex items-center justify-between">
                      {n.label}
                      <span className="flex gap-1">
                        <Kbd>G</Kbd>
                        <Kbd>{n.key!.toUpperCase()}</Kbd>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </SettingsCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SettingsCard icon={DatabaseBackup} title="Backup" description="Saved to MongoDB automatically. Export a JSON snapshot to keep." action={<SyncIndicator />}>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={download}>
              <Download data-icon="inline-start" /> Export
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload data-icon="inline-start" /> Import
            </Button>
          </div>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => setPending(e.target.files?.[0] ?? null)} />
        </SettingsCard>

        <SettingsCard icon={ShieldAlert} title="Account" description="Sign out of this device, or wipe your progress and start over.">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={logout}>
              <LogOut data-icon="inline-start" /> Sign out
            </Button>
            <Button variant="destructive" onClick={() => setConfirmReset(true)}>
              <RotateCcw data-icon="inline-start" /> Reset progress
            </Button>
          </div>
        </SettingsCard>
      </div>

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

/** Settings section: title and description inside the card so side-by-side cards line up. */
function SettingsCard({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Panel className="flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="mt-auto">{children}</div>
    </Panel>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { moduleEntry, useModule } from "./module";
import { MODULE_LIST, type ModuleId } from "./nav";

/**
 * DSA ↔ System Design switch. "full" = icon + label (wide sidebar), "icons" = stacked icons
 * (collapsed sidebar), "compact" = short labels (mobile header).
 */
export function ModuleSwitcher({ variant = "full", className }: { variant?: "full" | "icons" | "compact"; className?: string }) {
  const current = useModule();
  const router = useRouter();
  const go = (m: ModuleId) => {
    if (m !== current) router.push(moduleEntry(m));
  };

  return (
    <div
      role="radiogroup"
      aria-label="Preparation module"
      className={cn(
        "rounded-lg border border-sidebar-border bg-background/40 p-0.5",
        // "DSA" is short; give the System Design label the extra width so it never truncates.
        variant === "icons" ? "flex flex-col gap-0.5" : variant === "compact" ? "grid grid-cols-2 gap-0.5" : "grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-0.5",
        className,
      )}
    >
      {MODULE_LIST.map((m) => {
        const Icon = m.icon;
        const active = current === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${m.label} — ${m.description}`}
            title={`${m.label} — ${m.description} (G ${m.id === "dsa" ? "1" : "2"})`}
            onClick={() => go(m.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              variant === "icons" ? "size-9" : "h-8 px-2",
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {variant !== "icons" && <span className="truncate">{variant === "compact" ? m.short : m.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

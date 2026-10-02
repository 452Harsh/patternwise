"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useHydrated } from "@/lib/progress";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className, showLabel }: { className?: string; showLabel?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const dark = !hydrated || resolvedTheme !== "light";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
      {showLabel && <span>{dark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}

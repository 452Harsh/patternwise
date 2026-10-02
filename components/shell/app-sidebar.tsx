"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, LogOut, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Kbd } from "@/components/kit";
import { isDue, logout, needsRevisit, updateSettings, useHydrated, useStore } from "@/lib/progress";
import { streaks } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { NAV, isActive } from "./nav";
import { ThemeToggle } from "./theme-toggle";
import { openCommandMenu } from "./command-menu";
import { SyncIndicator } from "./sync-boot";

export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
        {"{}"}
      </span>
      {!collapsed && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight">Patternwise</span>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">DSA workspace</span>
        </span>
      )}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const state = useStore();
  const hydrated = useHydrated();
  const userCollapsed = state.settings.sidebarCollapsed;
  const revisionCount = Object.values(state.problems).filter((e) => isDue(e) || needsRevisit(e)).length;
  const { current } = streaks(state);
  const name = state.settings.name || "You";

  // Collapsed = user preference, or automatically on md..lg widths (via the `lg:` classes below).
  const wide = !userCollapsed;

  return (
    <aside
      aria-label="Sidebar"
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex",
        "w-[60px] transition-[width] duration-200",
        wide && "lg:w-60",
      )}
    >
      <div className={cn("flex h-14 items-center px-3", wide && "lg:justify-between")}>
        <span className={cn(wide ? "hidden lg:block" : "hidden")}>
          <Logo />
        </span>
        <span className={cn(wide ? "lg:hidden" : "")}>
          <Logo collapsed />
        </span>
        <button
          type="button"
          onClick={() => updateSettings({ sidebarCollapsed: !userCollapsed })}
          aria-label={userCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "hidden size-7 place-items-center rounded-md text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            wide && "lg:grid",
          )}
        >
          <PanelLeftClose className="size-4" aria-hidden />
        </button>
      </div>

      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={openCommandMenu}
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-lg border border-sidebar-border bg-background/40 px-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            !wide && "justify-center",
            wide && "max-lg:justify-center",
          )}
          aria-label="Search (Command K)"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className={cn("flex-1 text-left", wide ? "hidden lg:block" : "hidden")}>Search…</span>
          <Kbd className={cn(wide ? "hidden lg:inline-flex" : "hidden")}>⌘K</Kbd>
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2" aria-label="Main">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const badge = item.href === "/revision" && hydrated && revisionCount > 0 ? revisionCount : undefined;
          const link = (
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-8 items-center gap-2.5 rounded-lg px-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                !wide && "justify-center",
                wide && "max-lg:justify-center",
              )}
            >
              {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden />}
              <Icon className={cn("size-4 shrink-0", active && "text-primary")} aria-hidden />
              <span className={cn("flex-1 truncate", wide ? "hidden lg:block" : "sr-only")}>{item.label}</span>
              {badge !== undefined && (
                <span
                  className={cn(
                    "rounded-full bg-warning/15 px-1.5 font-mono text-[10px] font-semibold text-warning",
                    wide ? "hidden lg:inline" : "hidden",
                  )}
                >
                  {badge}
                </span>
              )}
              {badge !== undefined && (
                <span
                  className={cn("absolute top-1 right-1 size-1.5 rounded-full bg-warning", wide ? "lg:hidden" : "")}
                  aria-hidden
                />
              )}
            </Link>
          );
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger render={link} />
              <TooltipContent side="right" className={cn(wide && "lg:hidden")}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border p-2">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-1.5",
            !wide && "justify-center",
            wide && "max-lg:justify-center",
          )}
          title={`${current}-day streak`}
        >
          <Flame className={cn("size-4 shrink-0", current > 0 ? "text-warning" : "text-muted-foreground")} aria-hidden />
          <span className={cn("flex-1 text-sm", wide ? "hidden lg:block" : "sr-only")}>
            <span className="font-mono font-semibold tabular-nums">{hydrated ? current : 0}</span>
            <span className="text-muted-foreground"> day streak</span>
          </span>
          <SyncIndicator showLabel={false} className={cn(wide ? "hidden lg:inline-flex" : "hidden")} />
        </div>
        <div className={cn("flex items-center gap-1", !wide && "flex-col", wide && "max-lg:flex-col")}>
          <Link
            href="/settings"
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring",
              !wide && "justify-center",
              wide && "max-lg:justify-center",
            )}
            aria-label="Profile and settings"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/80 to-info/70 text-[11px] font-semibold text-primary-foreground">
              {(hydrated ? name : "Y").slice(0, 1).toUpperCase()}
            </span>
            <span className={cn("truncate text-sm", wide ? "hidden lg:block" : "sr-only")}>{hydrated ? name : "You"}</span>
          </Link>
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Sign out"
                  className="inline-flex h-8 items-center rounded-lg px-2 text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              }
            >
              <LogOut className="size-4" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        </div>
        {userCollapsed && (
          <button
            type="button"
            onClick={() => updateSettings({ sidebarCollapsed: false })}
            aria-label="Expand sidebar"
            className="hidden h-8 w-full place-items-center rounded-lg text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring lg:grid"
          >
            <PanelLeftOpen className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </aside>
  );
}

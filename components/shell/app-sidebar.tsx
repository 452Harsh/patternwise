"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Flame, LogOut, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Kbd } from "@/components/kit";
import { isDue, isSDDue, logout, needsRevisit, updateSettings, useHydrated, useStore } from "@/lib/progress";
import { streaks } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { useModule } from "./module";
import { ModuleSwitcher } from "./module-switcher";
import { MODULES, SHARED_NAV, isActive, navItems, type ModuleId, type NavItem } from "./nav";
import { ThemeToggle } from "./theme-toggle";
import { openCommandMenu } from "./command-menu";
import { SyncIndicator } from "./sync-boot";

export function Logo({ collapsed, href = "/" }: { collapsed?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
        {"{}"}
      </span>
      {!collapsed && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight">Patternwise</span>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Interview prep</span>
        </span>
      )}
    </Link>
  );
}

/** Revision badge counts, per module. */
export function useRevisionBadges(): Record<string, number | undefined> {
  const state = useStore();
  const hydrated = useHydrated();
  if (!hydrated) return {};
  const dsa = Object.values(state.problems).filter((e) => isDue(e) || needsRevisit(e)).length;
  const sd = Object.values(state.sd).filter(isSDDue).length;
  return { "/revision": dsa || undefined, "/system-design/revision": sd || undefined };
}

export function AppSidebar() {
  const state = useStore();
  const hydrated = useHydrated();
  const mod = useModule();
  const badges = useRevisionBadges();
  const userCollapsed = state.settings.sidebarCollapsed;
  const { current } = streaks(state, mod === "coach" ? "all" : mod);
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
          <Logo href={MODULES[mod].home} />
        </span>
        <span className={cn(wide ? "lg:hidden" : "")}>
          <Logo collapsed href={MODULES[mod].home} />
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

      <div className="space-y-2 px-2 pb-2">
        <ModuleSwitcher variant="full" className={cn(wide ? "hidden lg:grid" : "hidden")} />
        <ModuleSwitcher variant="icons" className={cn("mx-auto w-fit", wide ? "lg:hidden" : "")} />
        <button
          type="button"
          onClick={openCommandMenu}
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-lg border border-sidebar-border bg-background/40 px-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            !wide && "justify-center",
            wide && "max-lg:justify-center",
          )}
          aria-label={`Search ${MODULES[mod].label} (Command K)`}
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className={cn("flex-1 truncate text-left", wide ? "hidden lg:block" : "hidden")}>Search {MODULES[mod].label}…</span>
          <Kbd className={cn(wide ? "hidden lg:inline-flex" : "hidden")}>⌘K</Kbd>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2" aria-label={`${MODULES[mod].label} navigation`}>
        <Suspense fallback={<ModuleNav mod={mod} search="" wide={wide} badges={badges} />}>
          <ModuleNavWithSearch mod={mod} wide={wide} badges={badges} />
        </Suspense>
      </nav>

      <div className="space-y-1 border-t border-sidebar-border p-2">
        <div
          className={cn("flex items-center gap-2.5 rounded-lg px-2 py-1.5", !wide && "justify-center", wide && "max-lg:justify-center")}
          title={`${current}-day ${MODULES[mod].label} streak`}
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

function ModuleNavWithSearch(props: { mod: ModuleId; wide: boolean; badges: Record<string, number | undefined> }) {
  const search = useSearchParams().toString();
  return <ModuleNav {...props} search={search} />;
}

function ModuleNav({ mod, search, wide, badges }: { mod: ModuleId; search: string; wide: boolean; badges: Record<string, number | undefined> }) {
  const pathname = usePathname();
  const siblings = navItems(mod);
  const groups = [...MODULES[mod].groups, { id: "shared", label: undefined, items: SHARED_NAV }];

  return (
    <div className="space-y-1">
      {groups.map((group, gi) => (
        <div key={group.id} className={cn(gi > 0 && "pt-2")}>
          {group.label ? (
            <p className={cn("mb-0.5 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", wide ? "hidden lg:block" : "hidden")}>
              {group.label}
            </p>
          ) : null}
          {gi > 0 && <div className={cn("mx-2 mb-1 border-t border-sidebar-border", wide && group.label && "lg:hidden")} aria-hidden />}
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink item={item} active={isActive(item, pathname, search, siblings)} wide={wide} badge={badges[item.href]} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function NavLink({ item, active, wide, badge }: { item: NavItem; active: boolean; wide: boolean; badge?: number }) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-8 items-center gap-2.5 rounded-lg px-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
        !wide && "justify-center",
        wide && "max-lg:justify-center",
      )}
    >
      {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden />}
      <Icon className={cn("size-4 shrink-0", active && "text-primary")} aria-hidden />
      <span className={cn("flex-1 truncate", wide ? "hidden lg:block" : "sr-only")}>{item.label}</span>
      {badge !== undefined && (
        <span className={cn("rounded-full bg-warning/15 px-1.5 font-mono text-[10px] font-semibold text-warning", wide ? "hidden lg:inline" : "hidden")}>
          {badge}
        </span>
      )}
      {badge !== undefined && <span className={cn("absolute top-1 right-1 size-1.5 rounded-full bg-warning", wide ? "lg:hidden" : "")} aria-hidden />}
    </Link>
  );
  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right" className={cn(wide && "lg:hidden")}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

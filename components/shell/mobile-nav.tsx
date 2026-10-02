"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, LayoutDashboard, ListChecks, LogOut, Menu, RotateCcw, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { isDue, logout, needsRevisit, useHydrated, useStore } from "@/lib/progress";
import { streaks } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { Logo } from "./app-sidebar";
import { openCommandMenu } from "./command-menu";
import { NAV, isActive } from "./nav";
import { ThemeToggle } from "./theme-toggle";
import { SyncIndicator } from "./sync-boot";

const TABS = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/problems", label: "Problems", icon: ListChecks },
  { href: "/revision", label: "Revision", icon: RotateCcw },
  { href: "/progress", label: "Progress", icon: BarChart3 },
];

/** Top bar + bottom tab bar for small screens. */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const state = useStore();
  const hydrated = useHydrated();
  const revisionCount = Object.values(state.problems).filter((e) => isDue(e) || needsRevisit(e)).length;
  const { current } = streaks(state);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur md:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openCommandMenu}
            aria-label="Search"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="size-4" aria-hidden />
          </button>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72 p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="space-y-0.5 px-2" aria-label="All pages">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className={cn("size-4", active && "text-primary")} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex items-center justify-between border-t p-4 text-sm">
            <span>
              <span className="font-mono font-semibold">{hydrated ? current : 0}</span>
              <span className="text-muted-foreground"> day streak</span>
            </span>
            <ThemeToggle showLabel />
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <SyncIndicator />
            <button type="button" onClick={logout} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <LogOut className="size-4" aria-hidden /> Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = isActive(pathname, t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] outline-none focus-visible:bg-muted",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
              {t.label}
              {t.href === "/revision" && hydrated && revisionCount > 0 && (
                <span className="absolute top-2 left-1/2 ml-2 rounded-full bg-warning px-1 font-mono text-[9px] font-bold text-background">
                  {revisionCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

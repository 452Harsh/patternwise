"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { logout, useHydrated, useStore } from "@/lib/progress";
import { streaks } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { Logo, useRevisionBadges } from "./app-sidebar";
import { openCommandMenu } from "./command-menu";
import { useModule } from "./module";
import { ModuleSwitcher } from "./module-switcher";
import { MODULES, SHARED_NAV, isActive, navItems } from "./nav";
import { ThemeToggle } from "./theme-toggle";
import { SyncIndicator } from "./sync-boot";

/** Top bar + bottom tab bar for small screens; both follow the current module. */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const state = useStore();
  const hydrated = useHydrated();
  const mod = useModule();
  const def = MODULES[mod];
  const badges = useRevisionBadges();
  const siblings = navItems(mod);
  const { current } = streaks(state, mod);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b bg-background/85 px-3 backdrop-blur md:hidden">
        <Logo collapsed href={def.home} />
        <ModuleSwitcher variant="compact" className="w-40" />
        <div className="flex items-center">
          <button
            type="button"
            onClick={openCommandMenu}
            aria-label={`Search ${def.label}`}
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
            <SheetTitle>{def.label}</SheetTitle>
          </SheetHeader>
          <div className="px-3">
            <ModuleSwitcher variant="full" />
          </div>
          <nav className="overflow-y-auto px-2" aria-label={`${def.label} pages`}>
            {[...def.groups, { id: "shared", label: undefined, items: SHARED_NAV }].map((group, gi) => (
              <div key={group.id} className={cn(gi > 0 && "pt-3")}>
                {group.label && <p className="px-3 pb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item, pathname, "", siblings);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-10 items-center gap-3 rounded-lg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <Icon className={cn("size-4", active && "text-primary")} aria-hidden />
                          <span className="flex-1">{item.label}</span>
                          {badges[item.href] && (
                            <span className="rounded-full bg-warning/15 px-1.5 font-mono text-[10px] font-semibold text-warning">{badges[item.href]}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
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
        aria-label={`${def.label} primary`}
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {def.tabs.map((t) => {
          const Icon = t.icon;
          const active = isActive(t, pathname, "", siblings);
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
              {badges[t.href] && (
                <span className="absolute top-2 left-1/2 ml-2 rounded-full bg-warning px-1 font-mono text-[9px] font-bold text-background">{badges[t.href]}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

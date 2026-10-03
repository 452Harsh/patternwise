"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { MODULES, isSharedRoute, moduleForPath, type ModuleId } from "./nav";

/**
 * Which module the shell is showing. Module routes decide it directly; shared routes
 * (Settings) keep the module you came from. Also remembers the last page per module so
 * switching returns you where you left off.
 */
const KEY = "pw:module";
const lastPathKey = (m: ModuleId) => `pw:last:${m}`;
const listeners = new Set<() => void>();

const readModule = (): ModuleId => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "sd" || v === "coach" ? v : "dsa";
  } catch {
    return "dsa";
  }
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useModule(): ModuleId {
  const pathname = usePathname();
  const remembered = useSyncExternalStore(subscribe, readModule, () => "dsa" as ModuleId);
  const current = isSharedRoute(pathname) ? remembered : moduleForPath(pathname);

  useEffect(() => {
    if (isSharedRoute(pathname)) return;
    try {
      const m = moduleForPath(pathname);
      if (localStorage.getItem(KEY) !== m) {
        localStorage.setItem(KEY, m);
        listeners.forEach((l) => l());
      }
      localStorage.setItem(lastPathKey(m), pathname + window.location.search);
    } catch {}
  }, [pathname]);

  return current;
}

/** Where switching to `m` should land: the last page you visited there, else its dashboard. */
export function moduleEntry(m: ModuleId): string {
  try {
    const last = localStorage.getItem(lastPathKey(m));
    if (last && moduleForPath(last.split("?")[0]) === m) return last;
  } catch {}
  return MODULES[m].home;
}

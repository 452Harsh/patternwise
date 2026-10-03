"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/** Tabs whose state lives in the URL (?tab=), so the sidebar and back button follow along. */
export function UrlTabs<T extends string>({ base, tabs, active, label }: { base: string; tabs: [T, string][]; active: T; label: string }) {
  const router = useRouter();
  return (
    <div className="inline-flex flex-wrap rounded-lg border p-0.5" role="tablist" aria-label={label}>
      {tabs.map(([id, text], i) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          onClick={() => router.replace(i === 0 ? base : `${base}?tab=${id}`, { scroll: false })}
          className={cn(
            "h-7 rounded-md px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            active === id ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

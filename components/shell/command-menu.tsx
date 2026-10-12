"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/kit";
import { moduleEntry, useModule } from "./module";
import { MODULES, navItems } from "./nav";

const OPEN_EVENT = "patternwise:command";
export const openCommandMenu = () => window.dispatchEvent(new Event(OPEN_EVENT));

/** Start downloading the search list early (e.g. when the pointer reaches the search button). */
export const preloadCommandMenu = () => void import("./command-palette");

// The search list imports every DSA and System Design item, so it is its own chunk, loaded on first open.
const CommandPalette = dynamic(() => import("./command-palette").then((m) => m.CommandPalette), { ssr: false });

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

/**
 * ⌘K palette and "g then x" shortcuts, scoped to the current module.
 * "g 1" / "g 2" switch between DSA and System Design.
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [help, setHelp] = useState(false);
  const router = useRouter();
  const mod = useModule();
  const items = navItems(mod);
  if (open && !loaded) setLoaded(true);

  // Keep the latest module-scoped items available to the global key handler.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  });

  useEffect(() => {
    let pendingG = 0;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key === "?") {
        e.preventDefault();
        setHelp(true);
        return;
      }
      if (e.key === "g") {
        pendingG = Date.now();
        return;
      }
      if (pendingG && Date.now() - pendingG < 1200) {
        pendingG = 0;
        if (e.key === "1" || e.key === "2") {
          e.preventDefault();
          router.push(moduleEntry(e.key === "1" ? "dsa" : "sd"));
          return;
        }
        const item = itemsRef.current.find((n) => n.key === e.key.toLowerCase());
        if (item) {
          e.preventDefault();
          router.push(item.href);
        }
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, [router]);

  const label = MODULES[mod].label;

  return (
    <>
      {loaded && (
        <CommandPalette
          open={open}
          setOpen={setOpen}
          onHelp={() => {
            setOpen(false);
            setHelp(true);
          }}
        />
      )}

      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{label} keyboard shortcuts</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              Search {label}
              <span className="flex gap-1">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </span>
            </li>
            <li className="flex items-center justify-between">
              Switch to DSA / System Design
              <span className="flex gap-1">
                <Kbd>G</Kbd>
                <Kbd>1</Kbd>
                <span className="text-muted-foreground">/</span>
                <Kbd>G</Kbd>
                <Kbd>2</Kbd>
              </span>
            </li>
            {items
              .filter((n) => n.key)
              .map((n) => (
                <li key={n.href} className="flex items-center justify-between">
                  Go to {n.label}
                  <span className="flex gap-1">
                    <Kbd>G</Kbd>
                    <Kbd>{n.key!.toUpperCase()}</Kbd>
                  </span>
                </li>
              ))}
            <li className="flex items-center justify-between">
              Show this help
              <Kbd>?</Kbd>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">⌘P and ⌘R are left to the browser (print and reload), so pages use G-sequences instead.</p>
        </DialogContent>
      </Dialog>
    </>
  );
}

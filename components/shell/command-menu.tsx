"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowLeftRight, Blocks, Boxes, Keyboard, Library, ListChecks, Moon, Plus, Shapes, Workflow } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DifficultyBadge, Kbd } from "@/components/kit";
import { TopicIcon } from "@/components/topic-icon";
import { allPatterns, topics } from "@/data/curriculum";
import type { SDKind } from "@/data/sd";
import { useCatalog } from "@/lib/catalog";
import { useSDItems } from "@/lib/sd";
import { moduleEntry, useModule } from "./module";
import { MODULES, MODULE_LIST, moduleDigit, navItems } from "./nav";

const OPEN_EVENT = "patternwise:command";
export const openCommandMenu = () => window.dispatchEvent(new Event(OPEN_EVENT));

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

const SD_GROUPS: { kind: SDKind; heading: string; icon: typeof Blocks }[] = [
  { kind: "concept", heading: "Concepts", icon: Blocks },
  { kind: "pattern", heading: "Design patterns", icon: Shapes },
  { kind: "problem", heading: "Problems", icon: Boxes },
  { kind: "diagram", heading: "Architecture diagrams", icon: Workflow },
];

/**
 * ⌘K palette and "g then x" shortcuts, scoped to the current module.
 * "g 1" / "g 2" / "g 3" switch between DSA, System Design and AI Coach.
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const mod = useModule();
  const others = MODULE_LIST.filter((m) => m.id !== mod);
  const catalog = useCatalog();
  const sdItems = useSDItems();
  const items = navItems(mod);

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
        const target = MODULE_LIST[Number(e.key) - 1];
        if (target) {
          e.preventDefault();
          router.push(moduleEntry(target.id));
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

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const label = MODULES[mod].label;

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen} title={`Search ${label}`} description={`Jump to anything in ${label}`} className="sm:max-w-xl">
        <Command>
          <CommandInput placeholder={mod === "dsa" ? "Search DSA problems, patterns, topics…" : mod === "sd" ? "Search concepts, patterns, design problems…" : "Search coach pages and actions…"} />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>No results in {label}.</CommandEmpty>
            <CommandGroup heading={`${label} pages`}>
              {items.map((n) => {
                const Icon = n.icon;
                return (
                  <CommandItem key={n.href} value={`page ${n.label}`} onSelect={() => go(n.href)}>
                    <Icon aria-hidden />
                    {n.label}
                    {n.key && <CommandShortcut>G {n.key.toUpperCase()}</CommandShortcut>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="Actions">
              {others.map((o) => (
                <CommandItem key={o.id} value={`action switch to ${o.label} module`} onSelect={() => go(moduleEntry(o.id))}>
                  <ArrowLeftRight aria-hidden />
                  Switch to {o.label}
                  <CommandShortcut>G {moduleDigit(o.id)}</CommandShortcut>
                </CommandItem>
              ))}
              {mod !== "coach" && (
                <CommandItem
                  value={`action add a ${mod === "dsa" ? "DSA" : "design"} problem`}
                  onSelect={() => go(mod === "dsa" ? "/problems?add=1" : "/system-design/problems?add=1")}
                >
                  <Plus aria-hidden />
                  Add a {mod === "dsa" ? "DSA" : "design"} problem
                </CommandItem>
              )}
              <CommandItem
                value="action toggle theme dark light"
                onSelect={() => {
                  setTheme(resolvedTheme === "light" ? "dark" : "light");
                  setOpen(false);
                }}
              >
                <Moon aria-hidden />
                Toggle theme
              </CommandItem>
              <CommandItem
                value="action keyboard shortcuts help"
                onSelect={() => {
                  setOpen(false);
                  setHelp(true);
                }}
              >
                <Keyboard aria-hidden />
                Keyboard shortcuts
                <CommandShortcut>?</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />

            {mod === "dsa" ? (
              <>
                <CommandGroup heading="Topics">
                  {topics.map((t) => (
                    <CommandItem key={t.id} value={`topic ${t.name}`} onSelect={() => go(`/topics/${t.id}`)}>
                      <TopicIcon id={t.id} className="size-5 rounded-md [&_svg]:size-3" />
                      {t.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Patterns">
                  {allPatterns.map(({ pattern, topic }) => (
                    <CommandItem key={pattern.id} value={`pattern ${pattern.name} ${topic.name}`} onSelect={() => go(`/patterns/${pattern.id}`)}>
                      <Library aria-hidden />
                      <span className="truncate">{pattern.name}</span>
                      <span className="ml-auto truncate text-xs text-muted-foreground">{topic.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Problems">
                  {catalog.map(({ problem, pattern }) => (
                    <CommandItem key={problem.slug} value={`problem ${problem.title} ${pattern.name} ${problem.slug}`} onSelect={() => go(`/problems/${problem.slug}`)}>
                      <ListChecks aria-hidden />
                      <span className="truncate">{problem.title}</span>
                      <span className="ml-auto">
                        <DifficultyBadge difficulty={problem.difficulty} />
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : mod === "sd" ? (
              SD_GROUPS.map(({ kind, heading, icon: Icon }) => {
                const rows = sdItems.filter((x) => x.kind === kind);
                if (!rows.length) return null;
                return (
                  <CommandGroup key={kind} heading={heading}>
                    {rows.map((x) => (
                      <CommandItem key={x.key} value={`${kind} ${x.title} ${x.group} ${x.track}`} onSelect={() => go(x.href)}>
                        <Icon aria-hidden />
                        <span className="truncate">{x.title}</span>
                        <span className="ml-auto flex shrink-0 items-center gap-2">
                          {x.difficulty && <DifficultyBadge difficulty={x.difficulty} />}
                          <span className="font-mono text-[10px] uppercase text-muted-foreground">{x.track}</span>
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>

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
              Switch to DSA / System Design / AI Coach
              <span className="flex items-center gap-1">
                <Kbd>G</Kbd>
                <Kbd>1</Kbd>
                <span className="text-muted-foreground">/</span>
                <Kbd>2</Kbd>
                <span className="text-muted-foreground">/</span>
                <Kbd>3</Kbd>
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

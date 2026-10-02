"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Library, ListChecks, Moon, Plus, Keyboard } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DifficultyBadge, Kbd } from "@/components/kit";
import { TopicIcon } from "@/components/topic-icon";
import { allPatterns, topics } from "@/data/curriculum";
import { useCatalog } from "@/lib/catalog";
import { NAV } from "./nav";

const OPEN_EVENT = "patternwise:command";
export const openCommandMenu = () =>
  window.dispatchEvent(new Event(OPEN_EVENT));

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

/** ⌘K palette plus Linear-style "g then x" navigation shortcuts and "?" for help. */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const catalog = useCatalog();

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
        const item = NAV.find((n) => n.key === e.key.toLowerCase());
        pendingG = 0;
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

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Jump to a page, problem, pattern or topic"
        className="sm:max-w-xl"
      >
        <Command>
          <CommandInput placeholder="Search problems, patterns, topics…" />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Go to">
              {NAV.map((n) => {
                const Icon = n.icon;
                return (
                  <CommandItem
                    key={n.href}
                    value={`page ${n.label}`}
                    onSelect={() => go(n.href)}
                  >
                    <Icon aria-hidden />
                    {n.label}
                    <CommandShortcut>G {n.key.toUpperCase()}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="Actions">
              <CommandItem
                value="action add custom problem"
                onSelect={() => go("/problems?add=1")}
              >
                <Plus aria-hidden />
                Add a problem
              </CommandItem>
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
            <CommandGroup heading="Topics">
              {topics.map((t) => (
                <CommandItem
                  key={t.id}
                  value={`topic ${t.name}`}
                  onSelect={() => go(`/topics/${t.id}`)}
                >
                  <TopicIcon
                    id={t.id}
                    className="size-5 rounded-md [&_svg]:size-3"
                  />
                  {t.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Patterns">
              {allPatterns.map(({ pattern, topic }) => (
                <CommandItem
                  key={pattern.id}
                  value={`pattern ${pattern.name} ${topic.name}`}
                  onSelect={() => go(`/patterns/${pattern.id}`)}
                >
                  <Library aria-hidden />
                  <span className="truncate">{pattern.name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {topic.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Problems">
              {catalog.map(({ problem, pattern }) => (
                <CommandItem
                  key={problem.slug}
                  value={`problem ${problem.title} ${pattern.name} ${problem.slug}`}
                  onSelect={() => go(`/problems/${problem.slug}`)}
                >
                  <ListChecks aria-hidden />
                  <span className="truncate">{problem.title}</span>
                  <span className="ml-auto">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              Search everything
              <span className="flex gap-1">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </span>
            </li>
            {NAV.map((n) => (
              <li key={n.href} className="flex items-center justify-between">
                Go to {n.label}
                <span className="flex gap-1">
                  <Kbd>G</Kbd>
                  <Kbd>{n.key.toUpperCase()}</Kbd>
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between">
              Show this help
              <Kbd>?</Kbd>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            ⌘P and ⌘R are left to the browser (print and reload), so pages use
            G-sequences instead.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

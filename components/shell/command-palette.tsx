"use client";

import { useRouter } from "next/navigation";
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
import { DifficultyBadge } from "@/components/kit";
import { TopicIcon } from "@/components/topic-icon";
import { allPatterns, topics } from "@/data/curriculum";
import type { SDKind } from "@/data/sd";
import { useCatalog } from "@/lib/catalog";
import { useSDItems } from "@/lib/sd";
import { moduleEntry, useModule } from "./module";
import { MODULES, navItems, type ModuleId } from "./nav";

const SD_GROUPS: { kind: SDKind; heading: string; icon: typeof Blocks }[] = [
  { kind: "concept", heading: "Concepts", icon: Blocks },
  { kind: "pattern", heading: "Design patterns", icon: Shapes },
  { kind: "problem", heading: "Problems", icon: Boxes },
  { kind: "diagram", heading: "Architecture diagrams", icon: Workflow },
];

/**
 * The ⌘K search list. It needs every DSA and System Design item, so it lives in its own chunk
 * and is loaded on first open (see CommandMenu) instead of shipping with every page.
 */
export function CommandPalette({ open, setOpen, onHelp }: { open: boolean; setOpen: (open: boolean) => void; onHelp: () => void }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const mod = useModule();
  const other: ModuleId = mod === "dsa" ? "sd" : "dsa";
  const catalog = useCatalog();
  const sdItems = useSDItems();
  const items = navItems(mod);
  const label = MODULES[mod].label;
  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const setHelp = (v: boolean) => v && onHelp();

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title={`Search ${label}`} description={`Jump to anything in ${label}`} className="sm:max-w-xl">
      <Command>
        <CommandInput placeholder={mod === "dsa" ? "Search DSA problems, patterns, topics…" : "Search concepts, patterns, design problems…"} />
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
            <CommandItem value={`action switch to ${MODULES[other].label} module`} onSelect={() => go(moduleEntry(other))}>
              <ArrowLeftRight aria-hidden />
              Switch to {MODULES[other].label}
              <CommandShortcut>G {other === "dsa" ? "1" : "2"}</CommandShortcut>
            </CommandItem>
            <CommandItem
              value={`action add a ${mod === "dsa" ? "DSA" : "design"} problem`}
              onSelect={() => go(mod === "dsa" ? "/problems?add=1" : "/system-design/problems?add=1")}
            >
              <Plus aria-hidden />
              Add a {mod === "dsa" ? "DSA" : "design"} problem
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
          ) : (
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
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

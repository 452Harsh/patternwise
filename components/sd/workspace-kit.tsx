"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const rid = () => Math.random().toString(36).slice(2, 10);

/** Section wrapper with an anchor, used by both workspaces. */
export function WSection({
  id,
  title,
  hint,
  children,
  step,
}: {
  id: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
  step?: number;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20">
      <div className="mb-3 flex items-baseline gap-3">
        {step !== undefined && (
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted font-mono text-[11px] font-semibold" aria-hidden>
            {step}
          </span>
        )}
        <div className="min-w-0">
          <h2 id={`${id}-h`} className="text-sm font-semibold tracking-tight">
            {title}
          </h2>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** Editable list of short strings (requirements, actors…). */
export function StringList({
  items,
  onChange,
  placeholder,
  label,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  label: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <ul className="space-y-1.5" aria-label={label}>
          {items.map((it, i) => (
            <li key={i} className="group flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <Input
                value={it}
                onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
                aria-label={`${label} ${i + 1}`}
                className="h-8 flex-1 border-transparent bg-transparent px-1.5 shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent"
              />
              <Button variant="ghost" size="icon-sm" aria-label={`Remove ${it}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} aria-label={`Add to ${label}`} />
        <Button type="submit" variant="secondary" size="icon" aria-label={`Add to ${label}`} disabled={!draft.trim()}>
          <Plus />
        </Button>
      </form>
    </div>
  );
}

export interface Column<T> {
  key: keyof T & string;
  label: string;
  placeholder?: string;
  width?: string;
  /** "text" (default), "area" for multi-line, or a list of options for a select. */
  kind?: "text" | "area" | string[];
  mono?: boolean;
}

/** Editable rows of records (APIs, entities, trade-offs, use cases…). Cards on mobile, grid on desktop. */
export function RowsEditor<T extends { id: string }>({
  rows,
  columns,
  onChange,
  blank,
  addLabel,
  emptyText,
}: {
  rows: T[];
  columns: Column<T>[];
  onChange: (next: T[]) => void;
  blank: () => T;
  addLabel: string;
  emptyText?: string;
}) {
  const set = (id: string, key: keyof T, value: string) => onChange(rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const grid = { gridTemplateColumns: `${columns.map((c) => c.width ?? "1fr").join(" ")} 32px` };
  return (
    <div className="space-y-2">
      {rows.length > 0 ? (
        <div className="rounded-xl border bg-surface">
          <div className="hidden gap-2 border-b px-3 py-2 text-[11px] font-medium text-muted-foreground md:grid" style={grid}>
            {columns.map((c) => (
              <span key={c.key}>{c.label}</span>
            ))}
            <span />
          </div>
          <ul className="divide-y">
            {rows.map((r, i) => (
              <li key={r.id} className="grid grid-cols-1 gap-2 p-3 md:items-start md:[grid-template-columns:var(--cols)]" style={{ ["--cols" as string]: grid.gridTemplateColumns }}>
                {columns.map((c) => {
                  const value = String(r[c.key] ?? "");
                  const aria = `${c.label} ${i + 1}`;
                  return (
                    <label key={c.key} className="block min-w-0">
                      <span className="mb-1 block text-[11px] text-muted-foreground md:sr-only">{c.label}</span>
                      {Array.isArray(c.kind) ? (
                        <select
                          value={value}
                          onChange={(e) => set(r.id, c.key, e.target.value)}
                          aria-label={aria}
                          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-input/30 [&>option]:bg-popover"
                        >
                          {c.kind.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      ) : c.kind === "area" ? (
                        <Textarea
                          value={value}
                          onChange={(e) => set(r.id, c.key, e.target.value)}
                          placeholder={c.placeholder}
                          aria-label={aria}
                          rows={2}
                          className={cn("min-h-8 resize-y py-1.5 text-xs", c.mono && "font-mono")}
                        />
                      ) : (
                        <Input
                          value={value}
                          onChange={(e) => set(r.id, c.key, e.target.value)}
                          placeholder={c.placeholder}
                          aria-label={aria}
                          className={cn("h-8 text-xs", c.mono && "font-mono")}
                        />
                      )}
                    </label>
                  );
                })}
                <Button variant="ghost" size="icon-sm" aria-label={`Remove row ${i + 1}`} onClick={() => onChange(rows.filter((x) => x.id !== r.id))} className="justify-self-end">
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        emptyText && <p className="rounded-xl border border-dashed px-4 py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
      )}
      <Button variant="outline" size="sm" onClick={() => onChange([...rows, blank()])}>
        <Plus data-icon="inline-start" /> {addLabel}
      </Button>
    </div>
  );
}

/** Labelled multi-line field with a prompt. */
export function PromptField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium">{label}</span>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="resize-y bg-surface leading-relaxed" />
    </label>
  );
}

/** Collapsible "reference hints" panel: hidden by default so you attempt the design first. */
export function Hints({ children, label = "Reference hints" }: { children: React.ReactNode; label?: string }) {
  return (
    <details className="group rounded-xl border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {label}
        <span className="text-xs font-normal text-muted-foreground group-open:hidden">Try it yourself first · show</span>
        <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">hide</span>
      </summary>
      <div className="space-y-4 border-t px-4 py-4 text-sm">{children}</div>
    </details>
  );
}

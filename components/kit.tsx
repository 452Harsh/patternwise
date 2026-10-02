/**
 * Small presentational building blocks shared across pages.
 * Server-safe: no hooks, no browser APIs.
 */
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/data/types";
import type { DisplayStatus } from "@/lib/progress";
import {
  CircleCheck,
  CircleDashed,
  CircleDot,
  Crown,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

export function Panel({
  className,
  interactive,
  ...props
}: React.ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border bg-card text-card-foreground",
        interactive &&
          "transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-foreground/15 motion-reduce:hover:translate-y-0",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({
  children,
  action,
  hint,
  id,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  hint?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 id={id} className="text-base font-semibold tracking-tight">
          {children}
        </h2>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ---------- meters ---------- */

const TONE = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
  muted: "bg-muted-foreground/40",
} as const;
export type Tone = keyof typeof TONE;

/** Horizontal bar that animates from zero on mount. value is 0–1. */
export function Meter({
  value,
  tone = "primary",
  className,
  label,
}: {
  value: number;
  tone?: Tone;
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(1, value || 0)) * 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full origin-left animate-grow-x rounded-full transition-[width] duration-500", TONE[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Circular progress. value is 0–1. */
export function Ring({
  value,
  size = 120,
  stroke = 10,
  tone = "primary",
  children,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  children?: React.ReactNode;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value || 0));
  const color = {
    primary: "var(--primary)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--destructive)",
    info: "var(--info)",
    muted: "var(--muted-foreground)",
  }[tone];
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(v * 100)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export const pct = (v: number) => `${Math.round((v || 0) * 100)}%`;

/** Tone for a 0–1 mastery value. */
export const masteryTone = (v: number): Tone => (v >= 0.75 ? "success" : v >= 0.45 ? "primary" : v > 0 ? "warning" : "muted");

/* ---------- badges ---------- */

const DIFF: Record<Difficulty, string> = {
  Easy: "text-success bg-success/10 ring-success/20",
  Medium: "text-warning bg-warning/10 ring-warning/20",
  Hard: "text-destructive bg-destructive/10 ring-destructive/20",
};

export function DifficultyBadge({ difficulty, className }: { difficulty: Difficulty; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md px-1.5 text-[11px] font-medium ring-1 ring-inset",
        DIFF[difficulty],
        className,
      )}
    >
      {difficulty}
    </span>
  );
}

export const STATUS_META: Record<DisplayStatus, { label: string; icon: LucideIcon; className: string }> = {
  "not-started": { label: "Not started", icon: CircleDashed, className: "text-muted-foreground" },
  attempted: { label: "Attempted", icon: CircleDot, className: "text-info" },
  solved: { label: "Solved", icon: CircleCheck, className: "text-success" },
  "needs-revision": { label: "Needs revision", icon: RotateCcw, className: "text-warning" },
  mastered: { label: "Mastered", icon: Crown, className: "text-primary" },
};

/** Icon + text, so status never depends on colour alone. */
export function StatusBadge({ status, compact }: { status: DisplayStatus; compact?: boolean }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", m.className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className={cn(compact && "sr-only")}>{m.label}</span>
    </span>
  );
}

export function Tag({ children, className, mono }: { children: React.ReactNode; className?: string; mono?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 max-w-full items-center truncate rounded-md bg-muted px-1.5 text-[11px] text-muted-foreground",
        mono && "font-mono",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Five dots showing a 1–5 confidence rating. */
export function Confidence({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={value ? `Confidence ${value} of 5` : "Not rated"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            n <= value ? (value <= 2 ? "bg-warning" : value >= 4 ? "bg-success" : "bg-primary") : "bg-muted-foreground/25",
          )}
        />
      ))}
    </span>
  );
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/* ---------- empty & loading ---------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center", className)}>
      <div className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} aria-hidden />;
}

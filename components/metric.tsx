import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Meter, Panel } from "@/components/kit";
import { cn } from "@/lib/utils";

/** Headline metric card used on the dashboards. */
export function Metric({
  icon: Icon,
  label,
  value,
  sub,
  progress,
  tone = "primary",
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  progress?: number;
  tone?: "primary" | "success" | "warning" | "info";
  href?: string;
}) {
  const body = (
    <Panel interactive={!!href} className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={cn("grid size-7 place-items-center rounded-lg", {
            "bg-primary/10 text-primary": tone === "primary",
            "bg-success/10 text-success": tone === "success",
            "bg-warning/10 text-warning": tone === "warning",
            "bg-info/10 text-info": tone === "info",
          })}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      {progress !== undefined && <Meter value={progress} tone={tone} className="mt-3" label={label} />}
    </Panel>
  );
  return href ? (
    <Link href={href} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  ) : (
    body
  );
}

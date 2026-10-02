import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** A styled native <select>: fully keyboard- and screen-reader-friendly, fast for long option lists. */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <select
        className="h-8 w-full cursor-pointer appearance-none rounded-lg border border-input bg-transparent py-0 pr-8 pl-2.5 text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 [&>option]:bg-popover [&>optgroup]:bg-popover"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </span>
  );
}

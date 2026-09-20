import { cn } from "@/lib/cn";
import type { SelectHTMLAttributes } from "react";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100",
        className,
      )}
      {...props}
    />
  );
}

import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary-400 focus:ring-2 focus:ring-primary-100",
        className,
      )}
      {...props}
    />
  );
}

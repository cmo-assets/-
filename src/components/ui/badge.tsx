import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "outline" | "warning" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variant === "default" && "bg-primary-50 text-primary-700",
        variant === "outline" && "border border-border text-muted-foreground",
        variant === "warning" && "bg-amber-50 text-amber-700",
        className,
      )}
      {...props}
    />
  );
}

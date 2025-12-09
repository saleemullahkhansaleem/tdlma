import * as React from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "destructive" | "outline" | "soft";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium";

  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-primary text-primary-foreground border-transparent",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
    outline: "border-border text-foreground bg-transparent",
    soft: "bg-muted text-foreground border-transparent",
  };

  return (
    <div className={cn(base, variants[variant], className)} {...props} />
  );
}

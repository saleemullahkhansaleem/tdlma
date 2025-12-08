"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsProps {
  stats: {
    totalDays: number;
    sundays: number;
    workDays: number;
    close: number;
    open: number;
    unclosed: number;
    unopened: number;
    totalFine: number;
  };
  loading?: boolean;
}

export function DashboardStats({ stats, loading = false }: DashboardStatsProps) {
  const statItems = [
    { label: "Total Days", value: stats.totalDays },
    { label: "Sundays", value: stats.sundays },
    { label: "Work Days", value: stats.workDays },
    { label: "Close", value: stats.close },
    { label: "Open", value: stats.open },
    { label: "Unclosed", value: stats.unclosed },
    { label: "Unopened", value: stats.unopened },
    { label: "Total fine", value: `Rs ${stats.totalFine}/-` },
  ];

  return (
    <div className="grid gap-1 md:gap-2 grid-cols-2 sm:grid-cols-4 md:grid-cols-8">
      {statItems.map((item, idx) => (
        <Card key={item.label} className="rounded-md border border-border">
          <CardContent className="p-3 flex flex-col items-center gap-2">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="flex h-10 w-full items-center justify-center rounded-md bg-secondary text-lg font-semibold text-secondary-foreground">
                  {item.value}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  {item.label}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

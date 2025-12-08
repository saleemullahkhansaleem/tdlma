"use client";

import { Button } from "@/components/ui/button";
import { FilterType } from "@/lib/utils/date-filters";

interface DashboardFiltersProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function DashboardFilters({
  selectedFilter,
  onFilterChange,
}: DashboardFiltersProps) {
  const filters: FilterType[] = [
    "This Week",
    "10 Days",
    "15 Days",
    "20 Days",
    "30 Days",
    "This Month",
  ];

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-medium">Filters:</p>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter}
            size="sm"
            variant={selectedFilter === filter ? "default" : "outline"}
            className={`rounded-full px-4 py-1 text-xs font-semibold ${selectedFilter === filter
                ? "bg-primary text-primary-foreground"
                : ""
              }`}
            onClick={() => onFilterChange(filter)}
          >
            {filter}
          </Button>
        ))}
      </div>
    </div>
  );
}

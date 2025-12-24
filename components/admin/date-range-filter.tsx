"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onDateRangeChange,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current month range
  const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  };

  // Get last month range
  const getLastMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start, end };
  };

  const handleCurrentMonth = () => {
    const { start, end } = getCurrentMonthRange();
    onDateRangeChange(start, end);
    setIsOpen(false);
  };

  const handleLastMonth = () => {
    const { start, end } = getLastMonthRange();
    onDateRangeChange(start, end);
    setIsOpen(false);
  };

  const formatDate = (date: Date): string => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]}`;
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return "Select date range";
    return `${formatDate(startDate)} - ${formatDate(endDate)} ${endDate.getFullYear()}`;
  };

  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    onDateRangeChange(date, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    onDateRangeChange(startDate, date);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = getLocalDateString(today);

  return (
    <>
      {mounted ? (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full md:w-auto justify-start text-left font-normal rounded-full",
                !startDate && !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {formatDateRange()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-auto p-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCurrentMonth}
                  className="text-xs"
                >
                  Current Month
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLastMonth}
                  className="text-xs"
                >
                  Last Month
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <div className="space-y-2">
                  <Label className="pl-4 block">From</Label>
                  <Input
                    type="date"
                    value={startDate ? getLocalDateString(startDate) : ""}
                    onChange={handleStartDateChange}
                    max={maxDate}
                    className="w-40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="pl-4 block">To</Label>
                  <Input
                    type="date"
                    value={endDate ? getLocalDateString(endDate) : ""}
                    onChange={handleEndDateChange}
                    max={maxDate}
                    min={startDate ? getLocalDateString(startDate) : undefined}
                    className="w-40"
                  />
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="outline"
          className={cn(
            "w-full md:w-auto justify-start text-left font-normal rounded-full",
            !startDate && !endDate && "text-muted-foreground"
          )}
          disabled
        >
          <CalendarIcon className="h-4 w-4" />
          {formatDateRange()}
        </Button>
      )}
    </>
  );
}

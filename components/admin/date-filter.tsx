"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface DateFilterProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  className?: string;
}

export function DateFilter({
  selectedDate,
  onDateChange,
  className,
}: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get today's date in local timezone (YYYY-MM-DD format)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = getLocalDateString(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = getLocalDateString(yesterday);

  const maxDate = todayString; // Can't select future dates

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateCopy = new Date(date);
    dateCopy.setHours(0, 0, 0, 0);

    if (dateString === todayString) {
      return "Today";
    } else if (dateString === yesterdayString) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const handleToday = () => {
    onDateChange(todayString);
    setIsOpen(false);
  };

  const handleYesterday = () => {
    onDateChange(yesterdayString);
    setIsOpen(false);
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && value <= maxDate) {
      onDateChange(value);
    }
  };


  return (
    <div className={cn("flex items-center gap-2", className)}>
      {mounted ? (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="px-4"
            >
              <Calendar className="mr-2 h-3.5 w-3.5" />
              {formatDate(selectedDate)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-3" align="end">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={selectedDate === todayString ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={handleToday}
                >
                  Today
                </Button>
                <Button
                  variant={
                    selectedDate === yesterdayString ? "default" : "outline"
                  }
                  size="sm"
                  className="flex-1"
                  onClick={handleYesterday}
                >
                  Yesterday
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Select Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateInputChange}
                  max={maxDate}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Cannot select future dates
                </p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="outline"
          className="px-4"
          disabled
        >
          <Calendar className="mr-2 h-3.5 w-3.5" />
          {formatDate(selectedDate)}
        </Button>
      )}
    </div>
  );
}

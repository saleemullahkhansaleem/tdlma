"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface DisabledDatesManagerProps {
  disabledDates: string[];
  onChange: (dates: string[]) => void;
}

export function DisabledDatesManager({
  disabledDates,
  onChange,
}: DisabledDatesManagerProps) {
  const [newDate, setNewDate] = useState("");

  const handleAddDate = () => {
    if (!newDate) return;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newDate)) {
      alert("Invalid date format. Please use YYYY-MM-DD");
      return;
    }

    // Check if date is in the future
    const dateObj = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      alert("Cannot add past dates. Only future dates can be disabled.");
      return;
    }

    // Check if date already exists
    if (disabledDates.includes(newDate)) {
      alert("This date is already disabled.");
      return;
    }

    // Add date and sort
    const updated = [...disabledDates, newDate].sort();
    onChange(updated);
    setNewDate("");
  };

  const handleRemoveDate = (dateToRemove: string) => {
    onChange(disabledDates.filter((date) => date !== dateToRemove));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          placeholder="Select a future date"
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleAddDate}
          disabled={!newDate}
          className="rounded-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {disabledDates.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-md border bg-muted/50">
          {disabledDates.map((date) => (
            <Badge
              key={date}
              variant="soft"
              className="flex items-center gap-1 px-2 py-1"
            >
              <span>{formatDate(date)}</span>
              <button
                type="button"
                onClick={() => handleRemoveDate(date)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                aria-label={`Remove ${date}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {disabledDates.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No dates are currently disabled. Add dates to disable meals for specific days.
        </p>
      )}
    </div>
  );
}

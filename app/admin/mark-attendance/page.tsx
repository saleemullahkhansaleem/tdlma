"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AddGuestModal } from "@/components/admin/add-guest-modal";
import { AttendanceList } from "@/components/admin/attendance-list";
import { DateFilter } from "@/components/admin/date-filter";
import { AttendanceWithUser } from "@/lib/types/attendance";
import { getAttendance } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarkAttendancePage() {
  const { user } = useAuth();
  const [openGuest, setOpenGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceWithUser[]>([]);
  // Get today's date in local timezone (YYYY-MM-DD format)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(
    getLocalDateString(new Date())
  );
  const [mealType, setMealType] = useState<"Breakfast" | "Lunch" | "Dinner">("Lunch");

  const loadAttendance = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getAttendance(user, {
        date: selectedDate,
        mealType,
      });
      setAttendance(data);
    } catch (err: any) {
      setError(err.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleItemUpdate = (updatedItem: AttendanceWithUser) => {
    // Optimistically update only the changed item in the state
    setAttendance((prev) => {
      // Check if item exists
      const existingIndex = prev.findIndex(
        (item) =>
          item.id === updatedItem.id ||
          (item.userId === updatedItem.userId &&
            item.date === updatedItem.date &&
            item.mealType === updatedItem.mealType)
      );

      if (existingIndex >= 0) {
        // Update existing item
        return prev.map((item, index) =>
          index === existingIndex ? updatedItem : item
        );
      } else {
        // Add new item (for newly created attendance)
        return [...prev, updatedItem];
      }
    });
  };

  useEffect(() => {
    loadAttendance();
  }, [user, selectedDate, mealType]);


  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Mark Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Update attendance and add guests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateFilter
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          <Button
            className="px-5"
            onClick={() => setOpenGuest(true)}
          >
            Add Guest
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-md border">
          <div className="space-y-0">
            <div className="border-b p-4">
              <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b p-4 last:border-b-0">
                <div className="grid grid-cols-4 gap-4 items-center">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : attendance.length === 0 ? (
        <div className="rounded-md border bg-card p-12 text-center">
          <p className="text-muted-foreground">No users found for this date</p>
        </div>
      ) : (
        <section>
          <AttendanceList
            attendance={attendance}
            onUpdate={loadAttendance}
            onItemUpdate={handleItemUpdate}
            selectedDate={selectedDate}
          />
        </section>
      )}

      <AddGuestModal
        open={openGuest}
        onOpenChange={setOpenGuest}
        date={selectedDate}
        mealType={mealType}
        onSuccess={loadAttendance}
      />
    </div>
  );
}

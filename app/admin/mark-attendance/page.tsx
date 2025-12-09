"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddGuestModal } from "@/components/admin/add-guest-modal";
import { AttendanceList } from "@/components/admin/attendance-list";
import { DateFilter } from "@/components/admin/date-filter";
import { AttendanceWithUser } from "@/lib/types/attendance";
import { getAttendance } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Search } from "lucide-react";

export default function MarkAttendancePage() {
  const { user } = useAuth();
  const [openGuest, setOpenGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceWithUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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


  // Filter attendance based on search query
  const filteredAttendance = attendance.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.user.name.toLowerCase().includes(query) ||
      item.user.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            Mark Attendance
          </h2>
          <p className="text-sm text-muted-foreground">
            Update attendance and add guests for the selected date
          </p>
        </div>
        <div>
          <Button
            className="rounded-full w-full sm:w-auto"
            onClick={() => setOpenGuest(true)}
          >
            Add Guest
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-md border bg-card p-4">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <DateFilter
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <div className="space-y-0 min-w-full">
              {/* Header Skeleton */}
              <div className="border-b p-4">
                <div className="grid grid-cols-4 gap-2 sm:gap-4 min-w-[600px]">
                  <Skeleton className="h-4 w-20 min-w-[150px] sm:min-w-[200px]" />
                  <Skeleton className="h-4 w-24 min-w-[180px] sm:min-w-[220px]" />
                  <Skeleton className="h-4 w-16 min-w-[100px] sm:min-w-[120px]" />
                  <Skeleton className="h-4 w-20 min-w-[100px] sm:min-w-[120px]" />
                </div>
              </div>
              {/* Row Skeletons */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-b p-4 last:border-b-0">
                  <div className="grid grid-cols-4 gap-2 sm:gap-4 items-center min-w-[600px]">
                    <Skeleton className="h-5 w-32 min-w-[150px] sm:min-w-[200px]" />
                    <Skeleton className="h-7 w-32 min-w-[180px] sm:min-w-[220px]" />
                    <Skeleton className="h-6 w-20 min-w-[100px] sm:min-w-[120px]" />
                    <Skeleton className="h-6 w-24 min-w-[100px] sm:min-w-[120px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredAttendance.length === 0 ? (
        <div className="rounded-md border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery
              ? "No users match your search"
              : "No users found for this date"}
          </p>
        </div>
      ) : (
        <section>
          <AttendanceList
            attendance={filteredAttendance}
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

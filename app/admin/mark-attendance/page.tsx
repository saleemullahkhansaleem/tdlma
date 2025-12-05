"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddGuestModal } from "@/components/admin/add-guest-modal";
import { AttendanceList } from "@/components/admin/attendance-list";
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
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
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

  useEffect(() => {
    loadAttendance();
  }, [user, selectedDate, mealType]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateString === today.toISOString().split("T")[0]) {
      return "Today";
    } else if (dateString === yesterday.toISOString().split("T")[0]) {
      return "Yesterday";
    } else if (dateString === tomorrow.toISOString().split("T")[0]) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

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
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Badge variant="soft" className="rounded-full px-4 py-1 cursor-pointer">
              {formatDate(selectedDate)}
            </Badge>
          </div>
          <Button
            className="rounded-full px-5"
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
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <section>
          <AttendanceList attendance={attendance} onUpdate={loadAttendance} />
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

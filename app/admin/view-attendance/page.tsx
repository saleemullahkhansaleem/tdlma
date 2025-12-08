"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DateFilter } from "@/components/admin/date-filter";
import { getAttendance } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { AttendanceWithUser } from "@/lib/types/attendance";

const allClear = [
  "ALI KHAN SWATI",
  "HASSAN KHAN SWATI",
  "MUHIB KHAN SWATI",
  "IRTAZA KHAN SWATI",
  "DANISH KHAN SWATI",
];

const unclosed = ["ZAYAN KHAN SWATI", "SHAQEEB KHAN SWATI", "AHMMED KHAN SWATI"];

const unopened = [
  "ESSA KHAN SWATI",
  "MUSA KHAN SWATI",
  "FAIZAN KHAN SWATI",
  "AHAD KHAN SWATI",
];

function StatusColumn({
  title,
  color,
  items,
}: {
  title: string;
  color: "green" | "red" | "orange";
  items: string[];
}) {
  const border =
    color === "green"
      ? "border-primary"
      : color === "red"
        ? "border-destructive"
        : "border-secondary";

  const headerBg =
    color === "green"
      ? "bg-primary/10 text-primary"
      : color === "red"
        ? "bg-destructive/10 text-destructive"
        : "bg-secondary/10 text-secondary";

  return (
    <Card className={`rounded-md ${border}`}>
      <CardContent className="p-4">
        <div
          className={`inline-flex rounded-full px-4 py-1 text-xs font-semibold ${headerBg}`}
        >
          {title}
        </div>
        <div className="mt-4 space-y-1.5 text-sm">
          {items.map((name) => (
            <div key={name} className="uppercase tracking-tight">
              {name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ViewAttendancePage() {
  const { user } = useAuth();
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
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceWithUser[]>([]);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const data = await getAttendance(user, {
          date: selectedDate,
          mealType: "Lunch",
        });
        setAttendance(data);
      } catch (error) {
        console.error("Failed to load attendance:", error);
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [user, selectedDate]);

  // Filter attendance by remark
  const allClearUsers = attendance
    .filter((a) => a.remark === "All Clear")
    .map((a) => a.user.name.toUpperCase());

  const unclosedUsers = attendance
    .filter((a) => a.remark === "Unclosed")
    .map((a) => a.user.name.toUpperCase());

  const unopenedUsers = attendance
    .filter((a) => a.remark === "Unopened")
    .map((a) => a.user.name.toUpperCase());

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold">View Attendance</h1>
        <DateFilter
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </header>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusColumn
          title="All Clear (Present)"
          color="green"
          items={loading ? [] : allClearUsers}
        />
        <StatusColumn
          title="All Clear (Absent)"
          color="green"
          items={loading ? [] : allClearUsers}
        />
        <StatusColumn
          title="Unclosed"
          color="red"
          items={loading ? [] : unclosedUsers}
        />
        <StatusColumn
          title="Unopened"
          color="orange"
          items={loading ? [] : unopenedUsers}
        />
      </section>
    </div>
  );
}

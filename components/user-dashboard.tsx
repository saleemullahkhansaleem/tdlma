"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import Link from "next/link";
import { MessageSquare, User, LogOut, FileText } from "lucide-react";
import { TodayMenu } from "@/components/today-menu";
import { getAllMenus, getAttendance } from "@/lib/api/client";
import { Menu, DayOfWeek, WeekType } from "@/lib/types/menu";
import { AttendanceWithUser } from "@/lib/types/attendance";
import { Skeleton } from "@/components/ui/skeleton";

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDayOfWeek(date: Date): DayOfWeek | null {
  const dayIndex = date.getDay();
  if (dayIndex === 0) return null; // Sunday - no menu
  const days: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayIndex - 1] || null;
}

function getWeekType(date: Date): WeekType {
  const weekNumber = getWeekNumber(date);
  return weekNumber % 2 === 0 ? "Even" : "Odd";
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

function getWeekDates(): Date[] {
  const monday = getMondayOfWeek(new Date());
  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    week.push(date);
  }
  return week;
}

function formatDateLabel(date: Date): { day: string; sub: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateCopy = new Date(date);
  dateCopy.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayName = dayNames[date.getDay()];
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  let sub = "";
  if (dateCopy.getTime() === today.getTime()) {
    sub = "Today";
  } else if (dateCopy.getTime() === yesterday.getTime()) {
    sub = "Yesterday";
  } else if (dateCopy.getTime() === tomorrow.getTime()) {
    sub = "Tomorrow";
  }

  return {
    day: `${dayName}, ${formattedDate}`,
    sub,
  };
}

interface TimetableRow {
  date: Date;
  dateString: string;
  dayLabel: string;
  subLabel: string;
  menuName: string;
  menuImage: string;
  status: "Open" | "Close" | "-";
  action: string;
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [fineAmount, setFineAmount] = useState({ unclosed: 100, unopened: 50 });
  const [timetableRows, setTimetableRows] = useState<TimetableRow[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);

  useEffect(() => {
    const loadTimetable = async () => {
      if (!user) {
        setLoadingTimetable(false);
        return;
      }

      try {
        const weekDates = getWeekDates();
        const weekMenus: Menu[] = [];
        const weekAttendance: AttendanceWithUser[] = [];

        // Fetch all menus for the week
        const allMenus = await getAllMenus(user);

        // Fetch attendance for each day (Lunch meal type)
        const attendancePromises = weekDates.map((date) =>
          getAttendance(user, {
            date: date.toISOString().split("T")[0],
            mealType: "Lunch",
          }).catch(() => [])
        );
        const attendanceResults = await Promise.all(attendancePromises);
        const allAttendance = attendanceResults.flat();

        // Build timetable rows
        const rows: TimetableRow[] = weekDates.map((date) => {
          const dateString = date.toISOString().split("T")[0];
          const { day: dayLabel, sub: subLabel } = formatDateLabel(date);
          const dayOfWeek = getDayOfWeek(date);
          const weekType = getWeekType(date);

          // Find menu for this day
          let menuName = "-";
          let menuImage = "/logo.png";

          if (dayOfWeek) {
            const menu = allMenus.find(
              (m) => m.dayOfWeek === dayOfWeek && m.weekType === weekType
            );
            if (menu?.menuItems?.[0]) {
              menuName = menu.menuItems[0].name;
              menuImage = menu.menuItems[0].imageUrl;
            }
          }

          // Find attendance for this user on this date
          const userAttendance = allAttendance.find(
            (a) => a.userId === user.id && a.date === dateString && a.mealType === "Lunch"
          );

          // Determine status based on remark and attendance status
          let status: "Open" | "Close" | "-" = "-";
          let action = "";

          if (!dayOfWeek) {
            // Sunday - no menu, no status
            status = "-";
            action = "";
          } else if (userAttendance) {
            const remark = userAttendance.remark;
            // Priority: remark over status
            if (remark === "Unclosed" || remark === "Unopened") {
              status = "Close";
              action = "Open";
            } else if (remark === "All Clear") {
              status = "Open";
              action = "Close";
            } else if (userAttendance.status === "Present") {
              status = "Open";
              action = "Close";
            } else if (userAttendance.status === "Absent") {
              status = "Close";
              action = "Open";
            } else {
              // No status or remark set yet
              status = "Open";
              action = "Close";
            }
          } else {
            // No attendance record yet, default to Open
            status = "Open";
            action = "Close";
          }

          return {
            date,
            dateString,
            dayLabel,
            subLabel,
            menuName,
            menuImage,
            status,
            action,
          };
        });

        setTimetableRows(rows);
      } catch (error) {
        console.error("Failed to load timetable:", error);
        setTimetableRows([]);
      } finally {
        setLoadingTimetable(false);
      }
    };

    loadTimetable();
  }, [user]);

  return (
    <div className="min-h-screen bg-muted px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <TodayMenu imageSize={32} textSize="lg" />
          </div>

          <div className="flex items-center gap-3">
            <Link href="/user/feedback">
              <Button variant="outline" size="sm" className="rounded-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Feedback
              </Button>
            </Link>
            <ThemeToggle size="icon" variant="ghost" />
            <div className="text-right text-sm leading-tight">
              <p className="font-medium">{user?.name ?? "User"}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <Avatar
                    alt={user?.name}
                    fallback={user?.name?.[0] ?? "U"}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link href="/user/my-feedback" className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    My Feedback
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Alerts */}
        <section className="space-y-3 text-sm">
          <div className="flex max-w-max items-center gap-2 rounded-md bg-yellow-500/10 px-3 py-1 text-sm">
            <span className="mt-0.5 text-lg">⚠️</span>
            <p>
              Reminder: Open time is 10:00 AM. Please book or cancel your lunch
              before the deadline!
            </p>
          </div>

          <div className="max-w-2xl rounded-md bg-sky-500/10 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">What do “Unclosed” and “Unopened” mean?</p>

            <div className="mt-2 space-y-1.5">
              <p>
                <span className="font-medium text-foreground">Unclosed</span> &mdash; you opened the
                food but did not close it again and did not eat it, so the food was wasted.
              </p>
              <p>
                <span className="font-medium text-foreground">Unopened</span> &mdash; you properly
                closed the food box and ate it later (food was not wasted).
              </p>
            </div>

            <div className="mt-3 space-y-1.5">
              <p className="font-semibold text-foreground">Fine policy</p>
              <p>
                For <span className="font-medium text-foreground">Unclosed</span> meals, a fine of{" "}
                <span className="font-mono">Rs {fineAmount.unclosed}/-</span> will be applied.
              </p>
              <p>
                For <span className="font-medium text-foreground">Unopened</span> meals, a fine of{" "}
                <span className="font-mono">Rs {fineAmount.unopened}/-</span> will be applied.
              </p>
            </div>
          </div>
        </section>

        {/* Filters & stats */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium">Filters:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground"
              >
                This Week
              </Button>
              {["10 Days", "15 Days", "20 Days", "30 Days", "This Month"].map(
                (label) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    className="py-1 text-xs"
                  >
                    {label}
                  </Button>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-8">
            {["7", "1", "6", "2", "4", "3", "3", "1700"].map((value, idx) => {
              const labels = [
                "Total Days",
                "Sundays",
                "Work Days",
                "Close",
                "Open",
                "Unclosed",
                "Unopened",
                "Total fine",
              ];
              return (
                <Card key={labels[idx]} className="rounded-md border border-border">
                  <CardContent className="p-3 flex flex-col items-center gap-2">
                    <div className="flex h-10 w-full items-center justify-center rounded-md bg-secondary text-lg font-semibold text-secondary-foreground">
                      {value}
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center">
                      {labels[idx]}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Timetable */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Timetable</h2>
          <Card className="rounded-md">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 text-xs font-semibold text-muted-foreground">
                    <TableHead className="px-4 py-3 text-left">Day and Date</TableHead>
                    <TableHead className="px-4 py-3 text-left">Menu</TableHead>
                    <TableHead className="px-4 py-3 text-left">Status</TableHead>
                    <TableHead className="px-4 py-3 text-left">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTimetable ? (
                    Array.from({ length: 7 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-4 py-3">
                          <Skeleton className="h-12 w-full" />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Skeleton className="h-12 w-full" />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Skeleton className="h-12 w-full" />
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Skeleton className="h-12 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    timetableRows.map((row) => (
                      <TableRow key={row.dateString}>
                        <TableCell className="px-4 py-3 align-top">
                          <div className="flex flex-col">
                            <span className="font-medium">{row.dayLabel}</span>
                            {row.subLabel && (
                              <span className="text-xs text-muted-foreground">
                                {row.subLabel}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          {row.menuName === "-" ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Image
                                src={row.menuImage}
                                alt={row.menuName}
                                width={24}
                                height={24}
                                className="rounded-full border border-border object-cover"
                              />
                              <span className="text-muted-foreground">{row.menuName}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          {row.status === "Open" && (
                            <span className="inline-flex rounded-full bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-700">
                              Open
                            </span>
                          )}
                          {row.status === "Close" && (
                            <span className="inline-flex rounded-full bg-red-50 px-4 py-1 text-xs font-medium text-red-700">
                              Close
                            </span>
                          )}
                          {row.status === "-" && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          {row.action && (
                            <Button
                              size="sm"
                              variant={row.action === "Open" ? "outline" : "default"}
                            >
                              {row.action}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

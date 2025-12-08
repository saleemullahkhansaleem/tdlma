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
import { getAllMenus, getAttendance, updateAttendance, createAttendance, getSettings } from "@/lib/api/client";
import { Menu, DayOfWeek, WeekType } from "@/lib/types/menu";
import { AttendanceWithUser } from "@/lib/types/attendance";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardFilters } from "@/components/user/dashboard-filters";
import { FilterType } from "@/lib/utils/date-filters";
import { DashboardStats } from "@/components/user/dashboard-stats";
import {
  getFilterDates,
  getDayOfWeek,
  formatDateLabel,
} from "@/lib/utils/date-filters";

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekType(date: Date): WeekType {
  const weekNumber = getWeekNumber(date);
  return weekNumber % 2 === 0 ? "Even" : "Odd";
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
  remark: string | null;
  attendanceId: string | null;
  canToggle: boolean; // Whether user can toggle open/close
}

interface DashboardStatsData {
  totalDays: number;
  sundays: number;
  workDays: number;
  close: number;
  open: number;
  unclosed: number;
  unopened: number;
  totalFine: number;
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    closeTime: "18:00",
    fineAmountUnclosed: 0,
    fineAmountUnopened: 0,
    disabledDates: [] as string[],
  });
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("This Week");
  const [timetableRows, setTimetableRows] = useState<TimetableRow[]>([]);
  const [stats, setStats] = useState<DashboardStatsData>({
    totalDays: 0,
    sundays: 0,
    workDays: 0,
    close: 0,
    open: 0,
    unclosed: 0,
    unopened: 0,
    totalFine: 0,
  });
  const [togglingDates, setTogglingDates] = useState<Set<string>>(new Set());
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Load settings
  useEffect(() => {
    const loadSettingsData = async () => {
      if (!user) return;

      try {
        setLoadingSettings(true);
        const settingsData = await getSettings(user);
        setSettings({
          closeTime: settingsData.closeTime,
          fineAmountUnclosed: settingsData.fineAmountUnclosed,
          fineAmountUnopened: settingsData.fineAmountUnopened,
          disabledDates: settingsData.disabledDates,
        });
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettingsData();
  }, [user]);

  useEffect(() => {
    const loadTimetable = async () => {
      if (!user) {
        setLoadingTimetable(false);
        setLoadingStats(false);
        return;
      }

      try {
        setLoadingTimetable(true);
        setLoadingStats(true);

        const filterDates = getFilterDates(selectedFilter);

        // Fetch all menus (we'll filter by day and week type)
        const allMenus = await getAllMenus(user);

        // Fetch attendance for all dates in parallel (Lunch meal type)
        // Group dates by unique dates to avoid duplicate API calls
        const uniqueDates = Array.from(
          new Set(filterDates.map((d) => d.toISOString().split("T")[0]))
        );

        const attendancePromises = uniqueDates.map((dateString) =>
          getAttendance(user, {
            date: dateString,
            mealType: "Lunch",
          }).catch(() => [])
        );
        const attendanceResults = await Promise.all(attendancePromises);
        const allAttendance = attendanceResults.flat();

        // Filter to get only current user's attendance
        const userAttendance = allAttendance.filter((a) => a.userId === user.id);

        // Build timetable rows
        const rows: TimetableRow[] = filterDates.map((date) => {
          const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
          const dayAttendance = userAttendance.find(
            (a) => a.date === dateString && a.mealType === "Lunch"
          );

          // Determine status based on isOpen field (defaults to true/open)
          let status: "Open" | "Close" | "-" = "-";
          let action = "";
          let remark: string | null = null;
          let canToggle = false;

          // Get today's date (without time)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          const isToday = dateString === todayString;

          // Compare dates without time
          const dateOnly = new Date(date);
          dateOnly.setHours(0, 0, 0, 0);
          const isPast = dateOnly < today && !isToday;
          const isFuture = dateOnly > today;

          // Check if date is disabled
          const isDisabled = settings.disabledDates.includes(dateString);

          if (!dayOfWeek) {
            // Sunday - no menu, no status
            status = "-";
            action = "";
            canToggle = false;
          } else if (isDisabled) {
            // Disabled date - no action
            status = "-";
            action = "";
            canToggle = false;
          } else if (dayAttendance) {
            // Use isOpen field (defaults to true if not set)
            const isOpen = dayAttendance.isOpen ?? true;
            status = isOpen ? "Open" : "Close";
            remark = dayAttendance.remark || null;

            // Determine if user can toggle
            if (isPast) {
              // Past days - cannot toggle
              canToggle = false;
              action = "";
            } else if (isToday) {
              // Today - can toggle only before close time
              const now = new Date();
              const [closeHour, closeMinute] = settings.closeTime.split(":").map(Number);
              const closeTimeDate = new Date();
              closeTimeDate.setHours(closeHour, closeMinute, 0, 0);
              canToggle = now < closeTimeDate;
              action = canToggle ? (isOpen ? "Close" : "Open") : "";
            } else {
              // Future days - can toggle
              canToggle = true;
              action = isOpen ? "Close" : "Open";
            }
          } else {
            // No attendance record yet, default to Open
            status = "Open";
            if (isPast) {
              canToggle = false;
              action = "";
            } else if (isToday) {
              const now = new Date();
              const [closeHour, closeMinute] = settings.closeTime.split(":").map(Number);
              const closeTimeDate = new Date();
              closeTimeDate.setHours(closeHour, closeMinute, 0, 0);
              canToggle = now < closeTimeDate;
              action = canToggle ? "Close" : "";
            } else {
              canToggle = true;
              action = "Close";
            }
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
            remark,
            attendanceId: dayAttendance?.id || null,
            canToggle,
          };
        });

        setTimetableRows(rows);

        // Calculate stats from filtered data
        const calculatedStats = calculateStats(filterDates, userAttendance, settings);
        setStats(calculatedStats);
      } catch (error) {
        console.error("Failed to load timetable:", error);
        setTimetableRows([]);
        setStats({
          totalDays: 0,
          sundays: 0,
          workDays: 0,
          close: 0,
          open: 0,
          unclosed: 0,
          unopened: 0,
          totalFine: 0,
        });
      } finally {
        setLoadingTimetable(false);
        setLoadingStats(false);
      }
    };

    loadTimetable();
  }, [user, selectedFilter, settings]);

  const handleToggleOpenClose = async (row: TimetableRow) => {
    if (!user || !row.canToggle) return;

    const dateString = row.dateString;
    setTogglingDates((prev) => new Set(prev).add(dateString));

    try {
      const newIsOpen = row.status === "Open" ? false : true;

      // Optimistically update the row immediately
      setTimetableRows((prev) =>
        prev.map((r) =>
          r.dateString === dateString
            ? {
              ...r,
              status: newIsOpen ? "Open" : "Close",
              action: newIsOpen ? "Close" : "Open",
            }
            : r
        )
      );

      if (row.attendanceId) {
        // Update existing attendance (non-blocking)
        // Don't generate remark if status is null - let API handle it
        updateAttendance(row.attendanceId, { isOpen: newIsOpen }, user)
          .then((response) => {
            // Update with server response
            // Remark will only be set if status is not null (handled by API)
            setTimetableRows((prev) =>
              prev.map((r) =>
                r.dateString === dateString
                  ? {
                    ...r,
                    status: newIsOpen ? "Open" : "Close",
                    action: newIsOpen ? "Close" : "Open",
                    remark: response.remark || null, // Only use remark from API if status exists
                  }
                  : r
              )
            );
          })
          .catch((error) => {
            console.error("Failed to update attendance:", error);
            // On error, reload timetable
            loadTimetable();
          });
      } else {
        // Create new attendance (non-blocking)
        // Don't generate remark - status is null by default
        createAttendance(
          {
            userId: user.id,
            date: dateString,
            mealType: "Lunch",
            isOpen: newIsOpen,
          },
          user
        )
          .then((response) => {
            // Update with real ID
            // Remark will be null since status is null
            setTimetableRows((prev) =>
              prev.map((r) =>
                r.dateString === dateString
                  ? {
                    ...r,
                    attendanceId: response.id,
                    remark: response.remark || null, // Should be null if status is null
                  }
                  : r
              )
            );
          })
          .catch((error) => {
            console.error("Failed to create attendance:", error);
            // On error, reload timetable
            loadTimetable();
          });
      }
    } catch (error) {
      console.error("Failed to toggle open/close:", error);
      // On error, reload timetable
      loadTimetable();
    } finally {
      setTogglingDates((prev) => {
        const next = new Set(prev);
        next.delete(dateString);
        return next;
      });
    }
  };

  const loadTimetable = async () => {
    if (!user) {
      setLoadingTimetable(false);
      setLoadingStats(false);
      return;
    }

    try {
      setLoadingTimetable(true);
      setLoadingStats(true);

      const filterDates = getFilterDates(selectedFilter);

      // Fetch all menus
      const allMenus = await getAllMenus(user);

      // Fetch attendance for all dates in parallel
      const uniqueDates = Array.from(
        new Set(
          filterDates.map(
            (d) =>
              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
          )
        )
      );

      const attendancePromises = uniqueDates.map((dateString) =>
        getAttendance(user, {
          date: dateString,
          mealType: "Lunch",
        }).catch(() => [])
      );
      const attendanceResults = await Promise.all(attendancePromises);
      const allAttendance = attendanceResults.flat();

      // Filter to get only current user's attendance
      const userAttendance = allAttendance.filter((a) => a.userId === user.id);

      // Build timetable rows
      const rows: TimetableRow[] = filterDates.map((date) => {
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
        const dayAttendance = userAttendance.find(
          (a) => a.date === dateString && a.mealType === "Lunch"
        );

        // Determine status and action
        let status: "Open" | "Close" | "-" = "-";
        let action = "";
        let remark: string | null = null;
        let canToggle = false;

        // Get today's date (without time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const isToday = dateString === todayString;

        // Compare dates without time
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);
        const isPast = dateOnly < today && !isToday;
        const isFuture = dateOnly > today;

        // Check if date is disabled
        const isDisabled = settings.disabledDates.includes(dateString);

        if (!dayOfWeek) {
          status = "-";
          action = "";
          canToggle = false;
        } else if (isDisabled) {
          status = "-";
          action = "";
          canToggle = false;
        } else if (dayAttendance) {
          const isOpen = dayAttendance.isOpen ?? true;
          status = isOpen ? "Open" : "Close";
          remark = dayAttendance.remark || null;

          if (isPast) {
            canToggle = false;
            action = "";
          } else if (isToday) {
            const now = new Date();
            const [closeHour, closeMinute] = settings.closeTime.split(":").map(Number);
            const closeTimeDate = new Date();
            closeTimeDate.setHours(closeHour, closeMinute, 0, 0);
            canToggle = now < closeTimeDate;
            action = canToggle ? (isOpen ? "Close" : "Open") : "";
          } else {
            canToggle = true;
            action = isOpen ? "Close" : "Open";
          }
        } else {
          status = "Open";
          if (isPast) {
            canToggle = false;
            action = "";
          } else if (isToday) {
            const now = new Date();
            const [closeHour, closeMinute] = settings.closeTime.split(":").map(Number);
            const closeTimeDate = new Date();
            closeTimeDate.setHours(closeHour, closeMinute, 0, 0);
            canToggle = now < closeTimeDate;
            action = canToggle ? "Close" : "";
          } else {
            canToggle = true;
            action = "Close";
          }
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
          remark,
          attendanceId: dayAttendance?.id || null,
          canToggle,
        };
      });

      setTimetableRows(rows);

      // Calculate stats from filtered data
      const calculatedStats = calculateStats(filterDates, userAttendance, settings);
      setStats(calculatedStats);
    } catch (error) {
      console.error("Failed to load timetable:", error);
      setTimetableRows([]);
      setStats({
        totalDays: 0,
        sundays: 0,
        workDays: 0,
        close: 0,
        open: 0,
        unclosed: 0,
        unopened: 0,
        totalFine: 0,
      });
    } finally {
      setLoadingTimetable(false);
      setLoadingStats(false);
    }
  };

  function calculateStats(
    dates: Date[],
    attendance: AttendanceWithUser[],
    settings: { fineAmountUnclosed: number; fineAmountUnopened: number }
  ): DashboardStatsData {
    let totalDays = dates.length;
    let sundays = 0;
    let workDays = 0;
    let close = 0;
    let open = 0;
    let unclosed = 0;
    let unopened = 0;

    dates.forEach((date) => {
      const dayOfWeek = getDayOfWeek(date);
      if (!dayOfWeek) {
        sundays++;
      } else {
        workDays++;
      }

      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const dayAttendance = attendance.find(
        (a) => a.date === dateString && a.mealType === "Lunch" && a.userId === user?.id
      );

      if (dayAttendance && dayOfWeek) {
        const isOpen = dayAttendance.isOpen ?? true;
        const remark = dayAttendance.remark;

        if (isOpen) {
          open++;
        } else {
          close++;
        }

        if (remark === "Unclosed") {
          unclosed++;
        } else if (remark === "Unopened") {
          unopened++;
        }
      } else if (dayOfWeek) {
        // No attendance record, default to open
        open++;
      }
    });

    const totalFine = unclosed * settings.fineAmountUnclosed + unopened * settings.fineAmountUnopened;

    return {
      totalDays,
      sundays,
      workDays,
      close,
      open,
      unclosed,
      unopened,
      totalFine,
    };
  }

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
              Reminder: Close time is {settings.closeTime}. Please open or close your lunch
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
                <span className="font-mono">Rs {settings.fineAmountUnclosed}/-</span> will be applied.
              </p>
              <p>
                For <span className="font-medium text-foreground">Unopened</span> meals, a fine of{" "}
                <span className="font-mono">Rs {settings.fineAmountUnopened}/-</span> will be applied.
              </p>
            </div>
          </div>
        </section>

        {/* Filters & stats */}
        <section className="space-y-4">
          <DashboardFilters
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />

          <DashboardStats stats={stats} loading={loadingStats} />
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
                          {row.remark ? (
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${row.remark === "All Clear"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                  : row.remark === "Unclosed"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                                  }`}
                              >
                                {row.remark}
                              </span>
                              {row.canToggle && row.action && (
                                <Button
                                  size="sm"
                                  variant={row.action === "Open" ? "outline" : "default"}
                                  onClick={() => handleToggleOpenClose(row)}
                                  disabled={togglingDates.has(row.dateString)}
                                  className="mt-1 w-fit"
                                >
                                  {togglingDates.has(row.dateString) ? "..." : row.action}
                                </Button>
                              )}
                            </div>
                          ) : row.canToggle && row.action ? (
                            <Button
                              size="sm"
                              variant={row.action === "Open" ? "outline" : "default"}
                              onClick={() => handleToggleOpenClose(row)}
                              disabled={togglingDates.has(row.dateString)}
                            >
                              {togglingDates.has(row.dateString) ? "..." : row.action}
                            </Button>
                          ) : null}
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

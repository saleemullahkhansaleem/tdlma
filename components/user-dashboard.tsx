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
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MessageSquare, User, LogOut, FileText, DollarSign, Calendar } from "lucide-react";
import { NotificationBell } from "@/components/user/notification-bell";
import { TodayMenu } from "@/components/today-menu";
import { getAllMenus, getAttendance, updateAttendance, createAttendance, getSettings, getOffDays, getMonthlyExpenses, MonthlyExpenses } from "@/lib/api/client";
import { OffDay } from "@/lib/types/off-days";
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
import { calculateRemark } from "@/lib/utils";

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
  isOffDay?: boolean; // Whether this date is an off day
  offDayReason?: string; // Reason for the off day
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
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpenses | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

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
        });
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettingsData();
  }, [user]);

  // Load monthly expenses
  useEffect(() => {
    const loadMonthlyExpenses = async () => {
      if (!user) return;

      try {
        setLoadingExpenses(true);
        const expenses = await getMonthlyExpenses(user, selectedMonth.year, selectedMonth.month);
        setMonthlyExpenses(expenses);
      } catch (error) {
        console.error("Failed to load monthly expenses:", error);
        setMonthlyExpenses(null);
      } finally {
        setLoadingExpenses(false);
      }
    };

    loadMonthlyExpenses();
  }, [user, selectedMonth]);

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

        // Fetch off days
        const offDays = await getOffDays(user);
        const offDaysMap = new Map<string, OffDay>();
        offDays.forEach((offDay) => {
          offDaysMap.set(offDay.date, offDay);
        });

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

          // Check if this date is an off day
          const offDay = offDaysMap.get(dateString);
          const isOffDay = !!offDay;

          // Find menu for this day
          let menuName = "-";
          let menuImage = "/logo.png";

          if (isOffDay) {
            // If it's an off day, show the reason instead of menu
            menuName = offDay.reason;
            menuImage = "/logo.png";
          } else if (dayOfWeek) {
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

          if (isOffDay) {
            // Off day - no status, no action
            status = "-";
            action = "";
            canToggle = false;
          } else if (!dayOfWeek) {
            // Sunday - no menu, no status
            status = "-";
            action = "";
            canToggle = false;
          } else if (dayAttendance) {
            // Use isOpen field (defaults to true if not set)
            const isOpen = dayAttendance.isOpen ?? true;
            status = isOpen ? "Open" : "Close";
            // Calculate remark from status and isOpen (computed, not stored)
            const attendanceStatus = dayAttendance.status === "Present" || dayAttendance.status === "Absent"
              ? dayAttendance.status
              : null;
            remark = calculateRemark(attendanceStatus, isOpen);

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
            isOffDay,
            offDayReason: offDay?.reason,
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

      // Fetch off days
      const offDays = await getOffDays(user);
      const offDaysMap = new Map<string, OffDay>();
      offDays.forEach((offDay) => {
        offDaysMap.set(offDay.date, offDay);
      });

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

        // Check if this date is an off day
        const offDay = offDaysMap.get(dateString);
        const isOffDay = !!offDay;

        // Find menu for this day
        let menuName = "-";
        let menuImage = "/logo.png";

        if (isOffDay) {
          // If it's an off day, show the reason instead of menu
          menuName = offDay.reason;
          menuImage = "/logo.png";
        } else if (dayOfWeek) {
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

        if (isOffDay) {
          // Off day - no status, no action
          status = "-";
          action = "";
          canToggle = false;
        } else if (!dayOfWeek) {
          status = "-";
          action = "";
          canToggle = false;
        } else if (dayAttendance) {
          const isOpen = dayAttendance.isOpen ?? true;
          status = isOpen ? "Open" : "Close";
          // Calculate remark from status and isOpen (computed, not stored)
          const attendanceStatus = dayAttendance.status === "Present" || dayAttendance.status === "Absent"
            ? dayAttendance.status
            : null;
          remark = calculateRemark(attendanceStatus, isOpen);

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
          isOffDay,
          offDayReason: offDay?.reason,
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
        // Calculate remark from status and isOpen (computed, not stored)
        const attendanceStatus = dayAttendance.status === "Present" || dayAttendance.status === "Absent"
          ? dayAttendance.status
          : null;
        const remark = calculateRemark(attendanceStatus, isOpen);

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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:gap-8">
          {/* Header */}
          <header className="flex gap-4 items-center justify-between">
            <div className="shrink-0">
              <TodayMenu imageSize={32} textSize="lg" />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <NotificationBell />
              <Link href="/user/feedback" className="hidden sm:block">
                <Button variant="outline" size="sm" className="rounded-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Feedback</span>
                </Button>
              </Link>
              <Link href="/user/feedback" className="sm:hidden">
                <Button variant="outline" size="icon" className="rounded-full">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </Link>
              <ThemeToggle size="icon" variant="ghost" />
              <div className="hidden text-right text-sm leading-tight sm:block">
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
                    <Link href="/user/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/user/my-feedback" className="flex items-center">
                      <FileText />
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
          <section className="space-y-3">
            {loadingSettings ? (
              <Card className="border-yellow-500/20 bg-yellow-500/10">
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-full" />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-yellow-500/20 bg-yellow-500/10">
                <CardContent className="flex items-start gap-1 px-4 py-2">
                  <span className="size-6">⚠️</span>
                  <p className="flex-1 text-sm leading-relaxed">
                    <span className="font-semibold">Reminder:</span> Close time is{" "}
                    <span className="font-mono font-semibold">{settings.closeTime}</span>. Please
                    open or close your lunch before the deadline!
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-sky-500/20 bg-sky-500/10">
              <CardContent className="p-4">
                <p className="font-semibold text-foreground">What do “Unclosed” and “Unopened” mean?</p>

                <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground sm:mt-4">
                  <p>
                    <span className="font-semibold text-foreground">Unclosed</span> &mdash; you
                    opened the food but did not close it again and did not eat it, so the food was
                    wasted.
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Unopened</span> &mdash; you
                    properly closed the food box and ate it later (food was not wasted).
                  </p>
                </div>

                {loadingSettings ? (
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-semibold text-foreground">Fine policy</p>
                    <p>
                      For <span className="font-semibold text-foreground">Unclosed</span> meals, a
                      fine of{" "}
                      <span className="font-mono font-semibold">
                        Rs {settings.fineAmountUnclosed}/-
                      </span>{" "}
                      will be applied.
                    </p>
                    <p>
                      For <span className="font-semibold text-foreground">Unopened</span> meals, a
                      fine of{" "}
                      <span className="font-mono font-semibold">
                        Rs {settings.fineAmountUnopened}/-
                      </span>{" "}
                      will be applied.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Filters & stats */}
          <section className="space-y-4">
            <DashboardFilters
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />

            <DashboardStats stats={stats} loading={loadingStats} />
          </section>

          {/* Monthly Expenses */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold sm:text-xl flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Monthly Expenses
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={`${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split("-").map(Number);
                    setSelectedMonth({ year, month });
                  }}
                  className="text-sm border rounded-md px-3 py-1.5 bg-background"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;
                    return (
                      <option key={`${year}-${month}`} value={`${year}-${String(month).padStart(2, "0")}`}>
                        {date.toLocaleString("default", { month: "long", year: "numeric" })}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                {loadingExpenses ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-2/3" />
                  </div>
                ) : monthlyExpenses ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Monthly Base Amount</p>
                        <p className="text-lg font-semibold">Rs {monthlyExpenses.monthlyExpense.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Meal Expenses</p>
                        <p className="text-lg font-semibold">Rs {monthlyExpenses.mealExpenses.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Guest Expenses</p>
                        <p className="text-lg font-semibold">Rs {monthlyExpenses.guestExpenses.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Fines</p>
                        <p className="text-lg font-semibold text-destructive">Rs {monthlyExpenses.totalFines.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold">Total Monthly Expense</p>
                        <p className="text-2xl font-bold text-primary">Rs {monthlyExpenses.totalMonthlyExpense.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No expense data available for this month</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Timetable */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold sm:text-xl">Timetable</h2>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="px-3 py-3 text-left text-xs font-semibold sm:px-4 sm:text-sm">
                          Day and Date
                        </TableHead>
                        <TableHead className="px-3 py-3 text-left text-xs font-semibold sm:px-4 sm:text-sm">
                          Menu
                        </TableHead>
                        <TableHead className="px-3 py-3 text-left text-xs font-semibold sm:px-4 sm:text-sm">
                          Status
                        </TableHead>
                        <TableHead className="px-3 py-3 text-left text-xs font-semibold sm:px-4 sm:text-sm">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingTimetable ? (
                        Array.from({ length: 7 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell className="px-3 py-3 sm:px-4">
                              <div className="flex flex-col gap-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-3 sm:px-4">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-4 w-20" />
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-3 sm:px-4">
                              <Skeleton className="h-5 w-16" />
                            </TableCell>
                            <TableCell className="px-3 py-3 sm:px-4">
                              <Skeleton className="h-8 w-20" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : timetableRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No data available for the selected period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        timetableRows.map((row) => (
                          <TableRow key={row.dateString} className="hover:bg-muted/30">
                            <TableCell className="px-3 py-3 align-top sm:px-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium sm:text-base text-nowrap">
                                  {row.dayLabel}
                                </span>
                                {row.subLabel && (
                                  <span className="text-xs text-muted-foreground">
                                    {row.subLabel}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-3 align-top sm:px-4">
                              {row.isOffDay ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-secondary bg-secondary/30">
                                    <span className="text-xs">📅</span>
                                  </div>
                                  <span className="text-xs font-medium text-secondary sm:text-sm">
                                    {row.offDayReason}
                                  </span>
                                </div>
                              ) : row.menuName === "-" ? (
                                <span className="text-xs text-muted-foreground sm:text-sm">-</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Image
                                    src={row.menuImage}
                                    alt={row.menuName}
                                    width={24}
                                    height={24}
                                    className="h-6 w-6 shrink-0 rounded-full border border-border object-cover"
                                  />
                                  <span className="truncate text-xs text-muted-foreground sm:text-sm">
                                    {row.menuName}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-3 py-3 align-top sm:px-4">
                              {row.status === "Open" && (
                                <Badge variant="success" className="w-fit text-xs">
                                  Open
                                </Badge>
                              )}
                              {row.status === "Close" && (
                                <Badge variant="destructive" className="w-fit text-xs">
                                  Close
                                </Badge>
                              )}
                              {row.status === "-" && (
                                <span className="text-xs text-muted-foreground sm:text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell className="px-3 py-3 align-top sm:px-4">
                              <div className="flex flex-col gap-1.5">
                                {row.remark && (
                                  <Badge
                                    variant={
                                      row.remark === "All Clear" ? "soft" : "destructive"
                                    }
                                    className="w-fit text-xs"
                                  >
                                    {row.remark}
                                  </Badge>
                                )}
                                {row.canToggle && row.action && (
                                  <Button
                                    size="sm"
                                    variant={row.action === "Open" ? "outline" : "default"}
                                    onClick={() => handleToggleOpenClose(row)}
                                    disabled={togglingDates.has(row.dateString)}
                                    className="h-7 w-fit text-xs sm:h-8 sm:text-sm"
                                  >
                                    {togglingDates.has(row.dateString) ? (
                                      <span className="flex items-center gap-1">
                                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Processing...
                                      </span>
                                    ) : (
                                      row.action
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

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
import { MessageSquare, User, LogOut, FileText, DollarSign, Calendar, Receipt } from "lucide-react";
import { NotificationBell } from "@/components/user/notification-bell";
import { TodayMenu } from "@/components/today-menu";
import { getAllMenus, getAttendance, updateAttendance, createAttendance, getSettings, getOffDays, getMonthlyExpenses, MonthlyExpenses, getProfile, getGuests } from "@/lib/api/client";
import { OffDay } from "@/lib/types/off-days";
import { Menu, DayOfWeek, WeekType } from "@/lib/types/menu";
import { AttendanceWithUser } from "@/lib/types/attendance";
import { Guest } from "@/lib/types/guest";
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
  beforeCreationMessage?: string; // Message to show if date is before user creation
}

interface DashboardStatsData {
  totalDays: number;
  offDays: number;
  workDays: number;
  close: number;
  open: number;
  unclosed: number;
  unopened: number;
  totalFine: number;
  guests: number;
  guestExpense: number;
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
    offDays: 0,
    workDays: 0,
    close: 0,
    open: 0,
    unclosed: 0,
    unopened: 0,
    totalFine: 0,
    guests: 0,
    guestExpense: 0,
  });
  const [togglingDates, setTogglingDates] = useState<Set<string>>(new Set());
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpenses | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [userCreatedAt, setUserCreatedAt] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number }>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [currentMonthlyExpense, setCurrentMonthlyExpense] = useState<number>(0);
  const [currentGuestMealAmount, setCurrentGuestMealAmount] = useState<number>(0);
  const [futureMonthlyExpense, setFutureMonthlyExpense] = useState<{ value: string; effectiveDate: string } | null>(null);
  const [futureGuestMealAmount, setFutureGuestMealAmount] = useState<{ value: string; effectiveDate: string } | null>(null);
  const [loadingExpenseSettings, setLoadingExpenseSettings] = useState(true);

  // Load user profile to get creation date
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        const profile = await getProfile(user);
        const createdAt = new Date(profile.createdAt);
        setUserCreatedAt(createdAt);
        
        // Update selectedMonth if it's before user creation
        const createdYear = createdAt.getFullYear();
        const createdMonth = createdAt.getMonth() + 1;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        // If current month is before user creation, set to user creation month
        if (currentYear < createdYear || (currentYear === createdYear && currentMonth < createdMonth)) {
          setSelectedMonth({ year: createdYear, month: createdMonth });
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }
    };

    loadUserProfile();
  }, [user]);

  // Load settings
  useEffect(() => {
    const loadSettingsData = async () => {
      if (!user) return;

      try {
        setLoadingSettings(true);
        const settingsData = await getSettings(user);
        setSettings({
          closeTime: settingsData.closeTime || "18:00",
          fineAmountUnclosed: settingsData.fineAmountUnclosed || 0,
          fineAmountUnopened: settingsData.fineAmountUnopened || 0,
        });
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettingsData();
  }, [user]);

  // Load monthly expense and guest meal amount settings
  useEffect(() => {
    const loadExpenseSettings = async () => {
      if (!user) return;

      try {
        setLoadingExpenseSettings(true);
        const settingsData = await getSettings(user);
        setCurrentMonthlyExpense(settingsData.monthlyExpensePerHead || 0);
        setCurrentGuestMealAmount(settingsData.guestMealAmount || 0);

        // Fetch future settings from API
        try {
          const response = await fetch("/api/settings/future", {
            headers: {
              "x-user-id": user.id,
              "x-user-email": user.email,
              "x-user-name": user.name,
              "x-user-role": user.role,
              "Content-Type": "application/json",
            },
          });
          if (response.ok) {
            const futureSettings = await response.json();
            setFutureMonthlyExpense(futureSettings.monthlyExpensePerHead || null);
            setFutureGuestMealAmount(futureSettings.guestMealAmount || null);
          }
        } catch (error) {
          console.error("Failed to load future settings:", error);
        }
      } catch (error) {
        console.error("Failed to load expense settings:", error);
      } finally {
        setLoadingExpenseSettings(false);
      }
    };

    loadExpenseSettings();
  }, [user]);

  // Load monthly expenses
  useEffect(() => {
    const loadMonthlyExpenses = async () => {
      if (!user) return;

      // Don't load expenses for months before user creation
      if (userCreatedAt) {
        const createdYear = userCreatedAt.getFullYear();
        const createdMonth = userCreatedAt.getMonth() + 1;
        
        if (selectedMonth.year < createdYear || 
            (selectedMonth.year === createdYear && selectedMonth.month < createdMonth)) {
          setMonthlyExpenses(null);
          setLoadingExpenses(false);
          return;
        }
      }

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
  }, [user, selectedMonth.year, selectedMonth.month, userCreatedAt]);

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

          // Check if date is before user creation
          const dateOnly = new Date(date);
          dateOnly.setHours(0, 0, 0, 0);
          const userCreatedDate = userCreatedAt ? new Date(userCreatedAt) : null;
          if (userCreatedDate) {
            userCreatedDate.setHours(0, 0, 0, 0);
          }
          const isBeforeCreation = userCreatedDate && dateOnly < userCreatedDate;

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
          const isPast = dateOnly < today && !isToday;
          const isFuture = dateOnly > today;

          // If date is before user creation, show message instead of status
          if (isBeforeCreation) {
            return {
              date,
              dateString,
              dayLabel,
              subLabel,
              menuName,
              menuImage,
              status: "-",
              action: "",
              remark: null,
              attendanceId: null,
              canToggle: false,
              isOffDay: false,
              beforeCreationMessage: "You were not a member of TD-LMA",
            };
          }

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
              const closeTime = settings?.closeTime || "18:00";
              if (closeTime && typeof closeTime === "string") {
                const [closeHour, closeMinute] = closeTime.split(":").map(Number);
                const closeTimeDate = new Date();
                closeTimeDate.setHours(closeHour, closeMinute, 0, 0);
                canToggle = now < closeTimeDate;
              } else {
                canToggle = true; // Default to allowing toggle if closeTime is invalid
              }
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
              const closeTime = settings?.closeTime || "18:00";
              if (closeTime && typeof closeTime === "string") {
                const [closeHour, closeMinute] = closeTime.split(":").map(Number);
                const closeTimeDate = new Date();
                closeTimeDate.setHours(closeHour, closeMinute, 0, 0);
                canToggle = now < closeTimeDate;
              } else {
                canToggle = true; // Default to allowing toggle if closeTime is invalid
              }
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

        // Fetch guests for the user within the filter date range
        const filterStartDate = filterDates[0];
        const filterEndDate = filterDates[filterDates.length - 1];
        const filterStartStr = `${filterStartDate.getFullYear()}-${String(filterStartDate.getMonth() + 1).padStart(2, "0")}-${String(filterStartDate.getDate()).padStart(2, "0")}`;
        const filterEndStr = `${filterEndDate.getFullYear()}-${String(filterEndDate.getMonth() + 1).padStart(2, "0")}-${String(filterEndDate.getDate()).padStart(2, "0")}`;
        
        let userGuests: Guest[] = [];
        try {
          userGuests = await getGuests(user, {
            inviterId: user.id,
            startDate: filterStartStr,
            endDate: filterEndStr,
          });
        } catch (error) {
          console.error("Failed to fetch guests:", error);
        }

        // Calculate stats from filtered data
        const calculatedStats = calculateStats(filterDates, userAttendance, settings, offDaysMap, userGuests);
        setStats(calculatedStats);
      } catch (error) {
        console.error("Failed to load timetable:", error);
        setTimetableRows([]);
        setStats({
          totalDays: 0,
          offDays: 0,
          workDays: 0,
          close: 0,
          open: 0,
          unclosed: 0,
          unopened: 0,
          totalFine: 0,
          guests: 0,
          guestExpense: 0,
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

        // Check if date is before user creation
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);
        const userCreatedDate = userCreatedAt ? new Date(userCreatedAt) : null;
        if (userCreatedDate) {
          userCreatedDate.setHours(0, 0, 0, 0);
        }
        const isBeforeCreation = userCreatedDate && dateOnly < userCreatedDate;

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
        const isPast = dateOnly < today && !isToday;
        const isFuture = dateOnly > today;

        // If date is before user creation, show message instead of status
        if (isBeforeCreation) {
          return {
            date,
            dateString,
            dayLabel,
            subLabel,
            menuName,
            menuImage,
            status: "-",
            action: "",
            remark: null,
            attendanceId: null,
            canToggle: false,
            isOffDay: false,
            beforeCreationMessage: "You were not a member of TD-LMA",
          };
        }

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
            const closeTime = settings?.closeTime || "18:00";
            if (closeTime && typeof closeTime === "string") {
              const [closeHour, closeMinute] = closeTime.split(":").map(Number);
              const closeTimeDate = new Date();
              closeTimeDate.setHours(closeHour, closeMinute, 0, 0);
              canToggle = now < closeTimeDate;
            } else {
              canToggle = true; // Default to allowing toggle if closeTime is invalid
            }
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
            const closeTime = settings?.closeTime || "18:00";
            if (closeTime && typeof closeTime === "string") {
              const [closeHour, closeMinute] = closeTime.split(":").map(Number);
              const closeTimeDate = new Date();
              closeTimeDate.setHours(closeHour, closeMinute, 0, 0);
              canToggle = now < closeTimeDate;
            } else {
              canToggle = true; // Default to allowing toggle if closeTime is invalid
            }
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

      // Fetch guests for the user within the filter date range
      const filterStartDate = filterDates[0];
      const filterEndDate = filterDates[filterDates.length - 1];
      const filterStartStr = `${filterStartDate.getFullYear()}-${String(filterStartDate.getMonth() + 1).padStart(2, "0")}-${String(filterStartDate.getDate()).padStart(2, "0")}`;
      const filterEndStr = `${filterEndDate.getFullYear()}-${String(filterEndDate.getMonth() + 1).padStart(2, "0")}-${String(filterEndDate.getDate()).padStart(2, "0")}`;
      
      let userGuests: Guest[] = [];
      try {
        userGuests = await getGuests(user, {
          inviterId: user.id,
          startDate: filterStartStr,
          endDate: filterEndStr,
        });
      } catch (error) {
        console.error("Failed to fetch guests:", error);
      }

      // Calculate stats from filtered data
      const calculatedStats = calculateStats(filterDates, userAttendance, settings, offDaysMap, userGuests);
      setStats(calculatedStats);
    } catch (error) {
      console.error("Failed to load timetable:", error);
      setTimetableRows([]);
      setStats({
        totalDays: 0,
        offDays: 0,
        workDays: 0,
        close: 0,
        open: 0,
        unclosed: 0,
        unopened: 0,
        totalFine: 0,
        guests: 0,
        guestExpense: 0,
      });
    } finally {
      setLoadingTimetable(false);
      setLoadingStats(false);
    }
  };

  function calculateStats(
    dates: Date[],
    attendance: AttendanceWithUser[],
    settings: { fineAmountUnclosed: number; fineAmountUnopened: number },
    offDaysMap: Map<string, OffDay> | undefined,
    guests: Guest[] | undefined
  ): DashboardStatsData {
    let totalDays = dates.length;
    let offDays = 0;
    let workDays = 0;
    let close = 0;
    let open = 0;
    let unclosed = 0;
    let unopened = 0;

    dates.forEach((date) => {
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      
      // Check if it's a Sunday (day 0)
      const isSunday = date.getDay() === 0;
      
      // Check if it's a database off day
      const isDatabaseOffDay = offDaysMap?.has(dateString) || false;
      
      // A day is an off day if it's Sunday OR a database off day
      const isOffDay = isSunday || isDatabaseOffDay;
      
      if (isOffDay) {
        offDays++;
      } else {
        // Only count work days (non-off days, non-Sundays)
        workDays++;
        
        const dayOfWeek = getDayOfWeek(date);
        const dayAttendance = attendance.find(
          (a) => a.date === dateString && a.mealType === "Lunch" && a.userId === user?.id
        );

        // Only process attendance for work days (not Sundays, not off days)
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
          // No attendance record, default to open (only for work days)
          open++;
        }
      }
    });

    const totalFine = unclosed * settings.fineAmountUnclosed + unopened * settings.fineAmountUnopened;

    // Calculate guests count and expense
    const guestsCount = guests?.length || 0;
    const guestExpense = (guests?.reduce((sum, guest) => {
      const amount = typeof guest.amount === "string" ? parseFloat(guest.amount || "0") : (guest.amount || 0);
      return sum + amount;
    }, 0) || 0);

    return {
      totalDays,
      offDays,
      workDays,
      close,
      open,
      unclosed,
      unopened,
      totalFine,
      guests: guestsCount,
      guestExpense,
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
                      <FileText className="mr-2 h-4 w-4" />
                      My Feedback
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/user/transactions" className="flex items-center">
                      <Receipt className="mr-2 h-4 w-4" />
                      Transactions
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
                    <span className="font-mono font-semibold">{settings?.closeTime || "18:00"}</span>. Please
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

            {/* Monthly Expense and Guest Meal Amount */}
            <Card className="border-green-500/20 bg-green-500/10">
              <CardContent className="p-4">
                <p className="font-semibold text-foreground">Current Rates</p>

                {loadingExpenseSettings ? (
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="mt-4 space-y-3 text-xs leading-relaxed text-muted-foreground">
                    <div>
                      <p>
                        <span className="font-semibold text-foreground">Monthly Base Expense:</span>{" "}
                        <span className="font-mono font-semibold">
                          Rs {currentMonthlyExpense.toFixed(2)}/-
                        </span>
                      </p>
                      {futureMonthlyExpense && (
                        <p className="mt-1 text-xs italic">
                          From {new Date(futureMonthlyExpense.effectiveDate).toLocaleDateString()}: Rs {parseFloat(futureMonthlyExpense.value).toFixed(2)}/-
                        </p>
                      )}
                    </div>
                    <div>
                      <p>
                        <span className="font-semibold text-foreground">Guest Meal Amount:</span>{" "}
                        <span className="font-mono font-semibold">
                          Rs {currentGuestMealAmount.toFixed(2)}/-
                        </span>
                      </p>
                      {futureGuestMealAmount && (
                        <p className="mt-1 text-xs italic">
                          From {new Date(futureGuestMealAmount.effectiveDate).toLocaleDateString()}: Rs {parseFloat(futureGuestMealAmount.value).toFixed(2)}/-
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
                  {(() => {
                    if (!userCreatedAt) {
                      // Show loading state - return current month
                      const now = new Date();
                      return (
                        <option value={`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`}>
                          Loading...
                        </option>
                      );
                    }

                    const userCreatedDate = new Date(userCreatedAt);
                    const userCreatedYear = userCreatedDate.getFullYear();
                    const userCreatedMonth = userCreatedDate.getMonth() + 1;
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    const currentMonth = now.getMonth() + 1;

                    // Generate months from user creation to current month (max 12 months)
                    const months: React.ReactElement[] = [];
                    let year = currentYear;
                    let month = currentMonth;
                    let count = 0;

                    while (count < 12) {
                      // Check if this month is before user creation
                      if (year < userCreatedYear || (year === userCreatedYear && month < userCreatedMonth)) {
                        break;
                      }

                      const date = new Date(year, month - 1, 1);
                      months.push(
                        <option key={`${year}-${month}`} value={`${year}-${String(month).padStart(2, "0")}`}>
                          {date.toLocaleString("default", { month: "long", year: "numeric" })}
                        </option>
                      );

                      count++;
                      // Move to previous month
                      month--;
                      if (month < 1) {
                        month = 12;
                        year--;
                      }
                    }

                    return months;
                  })()}
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
                  <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Base Amount</p>
                        <p className="text-base font-semibold">Rs {monthlyExpenses.monthlyExpense.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Guest Expenses</p>
                        <p className="text-base font-semibold">Rs {monthlyExpenses.guestExpenses.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Fines</p>
                        <p className="text-base font-semibold text-destructive">Rs {monthlyExpenses.totalFines.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">Total</p>
                        <p className="text-xl font-semibold">Rs {monthlyExpenses.totalMonthlyExpense.toFixed(2)}</p>
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

          {/* Filters & stats */}
          <section className="space-y-4">
            <DashboardFilters
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />

            <DashboardStats stats={stats} loading={loadingStats} />
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
                              {row.beforeCreationMessage ? (
                                <span className="text-xs text-muted-foreground italic sm:text-sm">
                                  {row.beforeCreationMessage}
                                </span>
                              ) : row.status === "Open" ? (
                                <Badge variant="success" className="w-fit text-xs">
                                  Open
                                </Badge>
                              ) : row.status === "Close" ? (
                                <Badge variant="destructive" className="w-fit text-xs">
                                  Close
                                </Badge>
                              ) : (
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

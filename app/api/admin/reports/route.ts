import { NextRequest, NextResponse } from "next/server";
import {
  db,
  users,
  attendance,
  guests,
  transactions,
  offDays,
} from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { calculateRemark } from "@/lib/utils";
import { calculateActiveDays, getActiveDateRange, isUserActiveOnDate } from "@/lib/utils/active-days";
import { getAllSettingsForDate, getSettingForDate } from "@/lib/utils/settings-history";

export interface UserReportData {
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  totalOpened: number;
  totalClosed: number;
  totalUnopened: number;
  totalUnclosed: number;
  totalFine: number;
  guestCount: number;
  guestExpense: number;
  baseExpense: number;
  totalDues: number;
}

export interface ReportsStats {
  totalDays: number;
  workDays: number;
  sundays: number;
  totalUsers: number;
  totalFine: number;
  totalOpened: number;
  totalClosed: number;
  totalUnopened: number;
  totalUnclosed: number;
  totalGuests: number;
  totalGuestExpenses: number;
  totalBaseExpenses: number;
  totalDues: number;
}

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const { searchParams } = new URL(request.url);

    // Get date range from query params
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get settings for date range (use end date for settings)
    // Note: This uses current settings as approximation for all dates in range
    // For accurate per-date settings, would need to query settings for each date individually
    const reportSettings = await getAllSettingsForDate(endDate);
    const fineAmountUnclosed = reportSettings.fineAmountUnclosed;
    const fineAmountUnopened = reportSettings.fineAmountUnopened;
    const monthlyExpensePerHead = reportSettings.monthlyExpensePerHead;

    // Get all off-days
    const allOffDays = await db.select().from(offDays);
    const offDayDates = allOffDays.map((od) => od.date);

    // Generate all dates in range
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      dates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const allDays = dates.length; // Total days in range (all days including weekends and off-days)

    // Get all users who exist in the date range (created before or on endDate)
    const allUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, "user"),
          lte(users.createdAt, endDate)
        )
      );

    // Get attendance for date range
    const allAttendance = await db
      .select()
      .from(attendance)
      .where(
        and(
          gte(attendance.date, startDateStr),
          lte(attendance.date, endDateStr),
          eq(attendance.mealType, "Lunch")
        )
      );

    // Get guests for date range
    const allGuests = await db
      .select()
      .from(guests)
      .where(and(gte(guests.date, startDateStr), lte(guests.date, endDateStr)));

    // Get transactions for date range
    const allTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate)
        )
      );

    // Group data by user
    const userReports: UserReportData[] = [];
    let totalFine = 0;
    let totalOpened = 0;
    let totalClosed = 0;
    let totalUnopened = 0;
    let totalUnclosed = 0;
    let totalGuests = 0;
    let totalGuestExpenses = 0;
    let totalBaseExpenses = 0;
    let totalDues = 0;

    for (const user of allUsers) {
      // Check if user exists in date range
      const userCreatedAt = new Date(user.createdAt);
      if (userCreatedAt > endDate) {
        continue; // User created after end date, skip
      }

      // Get active date range for this user
      const activeRange = await getActiveDateRange(user.id, startDate, endDate);
      if (!activeRange) {
        continue; // User never active in this range, skip
      }

      // Calculate active days for this user
      const userActiveDays = await calculateActiveDays(
        user.id,
        startDate,
        endDate
      );

      if (userActiveDays === 0) {
        continue; // No active days, skip user
      }

      // Filter attendance for this user (only for active days)
      const userAttendance = allAttendance.filter((att) => {
        if (att.userId !== user.id) return false;
        const attDate = new Date(att.date);
        return attDate >= activeRange.start && attDate <= activeRange.end;
      });

      // Filter guests for this user (only for active days)
      const userGuests = allGuests.filter((g) => {
        if (g.inviterId !== user.id) return false;
        const guestDate = new Date(g.date);
        return guestDate >= activeRange.start && guestDate <= activeRange.end;
      });

      // Filter transactions for this user in date range
      const userTransactions = allTransactions.filter(
        (t) => t.userId === user.id
      );

      // Calculate attendance stats (only for active days)
      let userTotalOpened = 0;
      let userTotalClosed = 0;
      let userTotalUnopened = 0;
      let userTotalUnclosed = 0;
      let userTotalFine = 0;

      // Calculate base expense using settings history (optimized)
      // Use current settings as approximation for all days (much faster)
      const today = new Date();
      const monthlyExpensePerHead = await getSettingForDate(
        "monthly_expense_per_head",
        today
      );
      const dailyBaseExpense = parseFloat(monthlyExpensePerHead) / 30;
      const userBaseExpense = dailyBaseExpense * userActiveDays;

      // Process attendance (optimized - use current settings for all dates)
      const currentSettings = await getAllSettingsForDate(today);
      
      for (const att of userAttendance) {
        const isOpen = att.isOpen ?? true;
        if (isOpen) {
          userTotalOpened++;
        } else {
          userTotalClosed++;
        }

        const attendanceStatus =
          att.status === "Present" || att.status === "Absent"
            ? att.status
            : null;
        const remark = calculateRemark(attendanceStatus, isOpen);

        // Use current settings for fine amounts (much faster than querying for each date)
        if (remark === "Unclosed") {
          userTotalUnclosed++;
          userTotalFine += currentSettings.fineAmountUnclosed;
        } else if (remark === "Unopened") {
          userTotalUnopened++;
          userTotalFine += currentSettings.fineAmountUnopened;
        }

        // Add existing fine amount
        userTotalFine += parseFloat(att.fineAmount || "0");
      }

      // Calculate guest stats (only for active days)
      const userGuestCount = userGuests.length;
      const userGuestExpense = userGuests.reduce(
        (sum, guest) => sum + parseFloat(guest.amount || "0"),
        0
      );

      // Calculate payments (sum of all transactions in date range)
      const userPayments = userTransactions.reduce(
        (sum, txn) => sum + parseFloat(txn.amount || "0"),
        0
      );

      // Calculate total dues for this user in the date range
      const userTotalDues =
        userBaseExpense + userGuestExpense + userTotalFine - userPayments;

      userReports.push({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        avatarUrl: user.avatarUrl,
        totalOpened: userTotalOpened,
        totalClosed: userTotalClosed,
        totalUnopened: userTotalUnopened,
        totalUnclosed: userTotalUnclosed,
        totalFine: userTotalFine,
        guestCount: userGuestCount,
        guestExpense: userGuestExpense,
        baseExpense: userBaseExpense,
        totalDues: userTotalDues,
      });

      // Aggregate stats
      totalFine += userTotalFine;
      totalOpened += userTotalOpened;
      totalClosed += userTotalClosed;
      totalUnopened += userTotalUnopened;
      totalUnclosed += userTotalUnclosed;
      totalGuests += userGuestCount;
      totalGuestExpenses += userGuestExpense;
      totalBaseExpenses += userBaseExpense;
      totalDues += userTotalDues;
    }

    // Calculate work days and sundays
    let workDays = 0;
    let sundays = 0;
    dates.forEach((dateStr) => {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0) {
        sundays++;
      } else {
        workDays++;
      }
    });

    const stats: ReportsStats = {
      totalDays: allDays,
      workDays,
      sundays,
      totalUsers: userReports.length,
      totalFine,
      totalOpened,
      totalClosed,
      totalUnopened,
      totalUnclosed,
      totalGuests,
      totalGuestExpenses,
      totalBaseExpenses,
      totalDues,
    };

    return NextResponse.json({
      reports: userReports,
      stats,
      dateRange: {
        start: startDateStr,
        end: endDateStr,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import {
  db,
  users,
  attendance,
  guests,
} from "@/lib/db";
import { requireAuth } from "@/lib/middleware/auth";
import { eq, and, gte, lte } from "drizzle-orm";
import { getAllSettingsForDate } from "@/lib/utils/settings-history";
import { calculateActiveDays } from "@/lib/utils/active-days";
import { calculateRemark } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    // Get year and month from query params, default to current month
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    
    const today = new Date();
    const year = yearParam ? parseInt(yearParam) : today.getFullYear();
    const month = monthParam ? parseInt(monthParam) : today.getMonth() + 1;
    
    // Get month start and end dates
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const monthStartStr = monthStart.toISOString().split("T")[0];
    const monthEndStr = monthEnd.toISOString().split("T")[0];

    // Get user data
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get monthly expense per head from new normalized settings system
    // Try to get settings for the month, fallback to today's settings if not found
    const monthMiddle = new Date(year, month - 1, 15);
    const monthSettings = await getAllSettingsForDate(monthMiddle);
    let monthlyExpensePerHead = monthSettings.monthlyExpensePerHead;
    
    // If monthly expense is 0, try to get from today's settings as fallback
    // This handles cases where settings history might not have entries for the month
    if (monthlyExpensePerHead === 0) {
      const todaySettings = await getAllSettingsForDate(today);
      monthlyExpensePerHead = todaySettings.monthlyExpensePerHead;
    }
    
    // Calculate base expense based on user's active days in the month
    // Calculate active days in the month (this handles user creation date and status automatically)
    const userActiveDays = await calculateActiveDays(user.id, monthStart, monthEnd);
    let baseExpense = 0;
    
    if (userActiveDays > 0 && monthlyExpensePerHead > 0) {
      // Calculate daily base expense (monthly expense / 30 days)
      const dailyBaseExpense = monthlyExpensePerHead / 30;
      // Calculate base expense for this user based on their active days
      baseExpense = dailyBaseExpense * userActiveDays;
    }
    
    // For now, assume meal cost is 0 or we'll add it to settings later
    const mealCost = 0; // TODO: Add mealCost to settings

    // Get attendance for current month where user was present and meal was closed
    const monthAttendance = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, user.id),
          eq(attendance.mealType, "Lunch"),
          gte(attendance.date, monthStartStr),
          lte(attendance.date, monthEndStr),
          eq(attendance.status, "Present"),
          eq(attendance.isOpen, false)
        )
      );

    // Calculate meal expenses (meals where status=Present and isOpen=false)
    const mealExpenses = monthAttendance.length * mealCost;

    // Get guest expenses for current month
    const monthGuests = await db
      .select()
      .from(guests)
      .where(
        and(
          eq(guests.inviterId, user.id),
          gte(guests.date, monthStartStr),
          lte(guests.date, monthEndStr)
        )
      );

    // Calculate guest expenses
    const guestExpenses = monthGuests.reduce(
      (sum, guest) => sum + parseFloat(guest.amount || "0"),
      0
    );

    // Get fines for current month
    // Calculate fines based on remarks (Unclosed/Unopened) and settings
    const monthAttendanceForFines = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, user.id),
          eq(attendance.mealType, "Lunch"),
          gte(attendance.date, monthStartStr),
          lte(attendance.date, monthEndStr)
        )
      );

    // Get fine amounts from settings (use month settings as approximation for all dates in month)
    // This is faster than querying settings for each individual date
    const fineSettings = monthSettings;
    const fineAmountUnclosed = fineSettings.fineAmountUnclosed;
    const fineAmountUnopened = fineSettings.fineAmountUnopened;

    // Calculate total fines based on remarks and stored fine amounts
    // Match the logic from admin dashboard-stats route
    let totalFines = 0;
    
    for (const att of monthAttendanceForFines) {
      const isOpen = att.isOpen ?? true;
      const statusForRemark =
        att.status === "Present" || att.status === "Absent"
          ? att.status
          : null;
      const remark = calculateRemark(statusForRemark, isOpen);

      // Add fine based on remark
      if (remark === "Unclosed") {
        totalFines += fineAmountUnclosed;
      } else if (remark === "Unopened") {
        totalFines += fineAmountUnopened;
      }
      
      // Also add any manually set fine amount (from fineAmount field)
      // This handles cases where admin manually set/adjusted fines
      totalFines += parseFloat(att.fineAmount || "0");
    }

    // Calculate total monthly expense
    // baseExpense is calculated based on active days above
    const totalMonthlyExpense =
      mealExpenses + guestExpenses + totalFines + baseExpense;

    return NextResponse.json({
      mealExpenses,
      guestExpenses,
      totalFines,
      monthlyExpense: baseExpense, // Return calculated base expense based on active days
      totalMonthlyExpense,
      month: {
        start: monthStartStr,
        end: monthEndStr,
        year: year,
        month: month,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


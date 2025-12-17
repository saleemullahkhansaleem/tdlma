import { NextRequest, NextResponse } from "next/server";
import {
  db,
  users,
  attendance,
  guests,
  settings as settingsTable,
} from "@/lib/db";
import { requireAuth } from "@/lib/middleware/auth";
import { eq, and, gte, lte } from "drizzle-orm";

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

    // Get user data including monthlyExpense
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get settings for meal cost (we'll need to add this to settings)
    const [settings] = await db.select().from(settingsTable).limit(1);
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
    const monthFines = await db
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

    // Calculate total fines
    const totalFines = monthFines.reduce(
      (sum, att) => sum + parseFloat(att.fineAmount || "0"),
      0
    );

    // Get monthly expense from user
    const monthlyExpense = parseFloat(userData.monthlyExpense || "0");

    // Calculate total monthly expense
    const totalMonthlyExpense =
      mealExpenses + guestExpenses + totalFines + monthlyExpense;

    return NextResponse.json({
      mealExpenses,
      guestExpenses,
      totalFines,
      monthlyExpense,
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


import { NextRequest, NextResponse } from "next/server";
import {
  db,
  users,
  attendance,
  settings as settingsTable,
  offDays,
} from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { eq, and, sql, count, gte, lte, isNull, isNotNull } from "drizzle-orm";
import { calculateRemark } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today"; // today, week, month

    // Calculate date range based on period
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    let startDate = new Date(today);
    if (period === "week") {
      startDate.setDate(today.getDate() - 7);
    } else if (period === "month") {
      startDate.setDate(today.getDate() - 30);
    }

    // Get settings
    const [settings] = await db.select().from(settingsTable).limit(1);
    const fineAmountUnclosed = parseFloat(settings?.fineAmountUnclosed || "0");
    const fineAmountUnopened = parseFloat(settings?.fineAmountUnopened || "0");

    // Get all users (only regular users, not admins)
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "user"));

    // Count users by type
    const employeeCount = allUsers.filter(
      (u) => u.userType === "employee"
    ).length;
    const studentCount = allUsers.filter(
      (u) => u.userType === "student"
    ).length;
    const totalUsers = allUsers.length;

    // Get today's attendance
    const todayDateStr = today.toISOString().split("T")[0];
    const todayAttendance = await db
      .select()
      .from(attendance)
      .where(
        and(eq(attendance.date, todayDateStr), eq(attendance.mealType, "Lunch"))
      );

    // Calculate today's stats
    let todayPresent = 0;
    let todayAbsent = 0;
    let todayUnclosed = 0;
    let todayUnopened = 0;
    let todayMealsBooked = 0;
    let todayMealsClosed = 0;

    todayAttendance.forEach((att) => {
      const isOpen = att.isOpen ?? true;
      if (isOpen) {
        todayMealsBooked++;
      } else {
        todayMealsClosed++;
      }

      if (att.status === "Present") {
        todayPresent++;
        const remark = calculateRemark("Present", isOpen);
        if (remark === "Unopened") {
          todayUnopened++;
        }
      } else if (att.status === "Absent") {
        todayAbsent++;
        const remark = calculateRemark("Absent", isOpen);
        if (remark === "Unclosed") {
          todayUnclosed++;
        }
      }
    });

    // Get attendance for the period
    const periodAttendance = await db
      .select()
      .from(attendance)
      .where(
        and(
          gte(attendance.date, startDate.toISOString().split("T")[0]),
          lte(attendance.date, endDate.toISOString().split("T")[0]),
          eq(attendance.mealType, "Lunch")
        )
      );

    // Calculate period stats
    let periodPresent = 0;
    let periodAbsent = 0;
    let periodUnclosed = 0;
    let periodUnopened = 0;
    let periodTotalFine = 0;

    periodAttendance.forEach((att) => {
      const isOpen = att.isOpen ?? true;
      if (att.status === "Present") {
        periodPresent++;
        const remark = calculateRemark("Present", isOpen);
        if (remark === "Unopened") {
          periodUnopened++;
          periodTotalFine += fineAmountUnopened;
        }
      } else if (att.status === "Absent") {
        periodAbsent++;
        const remark = calculateRemark("Absent", isOpen);
        if (remark === "Unclosed") {
          periodUnclosed++;
          periodTotalFine += fineAmountUnclosed;
        }
      }
      // Add existing fine amount
      periodTotalFine += parseFloat(att.fineAmount || "0");
    });

    // Get attendance trends (last 7 days)
    const trendsStartDate = new Date(today);
    trendsStartDate.setDate(today.getDate() - 6);
    const trendsDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(trendsStartDate);
      date.setDate(trendsStartDate.getDate() + i);
      trendsDates.push(date.toISOString().split("T")[0]);
    }

    const trendsData = await Promise.all(
      trendsDates.map(async (dateStr) => {
        const dayAttendance = await db
          .select()
          .from(attendance)
          .where(
            and(eq(attendance.date, dateStr), eq(attendance.mealType, "Lunch"))
          );

        let present = 0;
        let absent = 0;
        let unclosed = 0;
        let unopened = 0;

        dayAttendance.forEach((att) => {
          const isOpen = att.isOpen ?? true;
          if (att.status === "Present") {
            present++;
            const remark = calculateRemark("Present", isOpen);
            if (remark === "Unopened") {
              unopened++;
            }
          } else if (att.status === "Absent") {
            absent++;
            const remark = calculateRemark("Absent", isOpen);
            if (remark === "Unclosed") {
              unclosed++;
            }
          }
        });

        return {
          date: dateStr,
          present,
          absent,
          unclosed,
          unopened,
        };
      })
    );

    // Calculate total loss (expected meals - actual meals)
    const totalLoss = todayMealsBooked - todayPresent;

    return NextResponse.json({
      // User stats
      totalUsers,
      employeeCount,
      studentCount,

      // Today's stats
      today: {
        mealsBooked: todayMealsBooked,
        mealsClosed: todayMealsClosed,
        present: todayPresent,
        absent: todayAbsent,
        unclosed: todayUnclosed,
        unopened: todayUnopened,
        totalLoss,
      },

      // Period stats
      period: {
        present: periodPresent,
        absent: periodAbsent,
        unclosed: periodUnclosed,
        unopened: periodUnopened,
        totalFine: periodTotalFine,
      },

      // Trends (last 7 days)
      trends: trendsData,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

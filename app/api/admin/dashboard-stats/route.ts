import { NextRequest, NextResponse } from "next/server";
import {
  db,
  users,
  attendance,
  offDays,
  guests,
  transactions,
  feedback,
} from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { eq, and, sql, count, gte, lte, isNull, isNotNull, desc } from "drizzle-orm";
import { calculateRemark } from "@/lib/utils";
import { getAllSettingsForDate } from "@/lib/utils/settings-history";
import { calculateActiveDays, getActiveDateRange } from "@/lib/utils/active-days";

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

    // Get current settings for fine calculations
    const currentSettings = await getAllSettingsForDate(today);
    const fineAmountUnclosed = currentSettings.fineAmountUnclosed;
    const fineAmountUnopened = currentSettings.fineAmountUnopened;

    // Get all users (both active and inactive for accurate counts)
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "user"));

    // Count users by status and type
    const activeUsers = allUsers.filter((u) => u.status === "Active");
    const inactiveUsers = allUsers.filter((u) => u.status === "Inactive");
    const employeeCount = activeUsers.filter(
      (u) => u.userType === "employee"
    ).length;
    const studentCount = activeUsers.filter(
      (u) => u.userType === "student"
    ).length;
    const totalUsers = allUsers.length;
    const activeUsersCount = activeUsers.length;
    const inactiveUsersCount = inactiveUsers.length;

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

    // ============================================
    // Financial Overview (Current Month)
    // ============================================
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthStartStr = currentMonthStart.toISOString().split("T")[0];
    const currentMonthEndStr = today.toISOString().split("T")[0];

    // Get current month settings
    const currentMonthMiddle = new Date(today.getFullYear(), today.getMonth(), 15);
    const monthSettings = await getAllSettingsForDate(currentMonthMiddle);
    const monthlyExpensePerHead = monthSettings.monthlyExpensePerHead;

    // Calculate financial data for current month
    let totalDues = 0;
    let totalPayments = 0;
    let totalGuestExpense = 0;
    let totalBaseExpense = 0;
    let totalFinesCurrentMonth = 0;
    let guestCountCurrentMonth = 0;
    let usersWithUnpaidBalances = 0;
    const topUsersByDues: Array<{ userId: string; userName: string; dues: number }> = [];

    // Get all users who were active in the current month
    const currentMonthActiveUsers = activeUsers.filter((u) => {
      const userCreatedAt = new Date(u.createdAt);
      return userCreatedAt <= today;
    });

    // Calculate financials for each user
    for (const user of currentMonthActiveUsers) {
      try {
        // Get active date range for this user in current month
        const activeRange = await getActiveDateRange(user.id, currentMonthStart, today);
        if (!activeRange) continue;

        // Calculate active days in current month
        const userActiveDays = await calculateActiveDays(user.id, currentMonthStart, today);
        if (userActiveDays === 0) continue;

        // Calculate base expense (daily rate * active days)
        const dailyBaseExpense = monthlyExpensePerHead / 30;
        const userBaseExpense = dailyBaseExpense * userActiveDays;
        totalBaseExpense += userBaseExpense;

        // Get guest expenses for current month
        const userGuests = await db
          .select()
          .from(guests)
          .where(
            and(
              eq(guests.inviterId, user.id),
              gte(guests.date, currentMonthStartStr),
              lte(guests.date, currentMonthEndStr)
            )
          );

        const userGuestExpense = userGuests.reduce(
          (sum, guest) => sum + parseFloat(guest.amount || "0"),
          0
        );
        totalGuestExpense += userGuestExpense;
        guestCountCurrentMonth += userGuests.length;

        // Get fines for current month
        const userAttendance = await db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.userId, user.id),
              eq(attendance.mealType, "Lunch"),
              gte(attendance.date, currentMonthStartStr),
              lte(attendance.date, currentMonthEndStr)
            )
          );

        let userFines = 0;
        for (const att of userAttendance) {
          const attDate = new Date(att.date);
          if (attDate >= activeRange.start && attDate <= activeRange.end) {
            const isOpen = att.isOpen ?? true;
            const statusForRemark =
              att.status === "Present" || att.status === "Absent" ? att.status : null;
            const remark = calculateRemark(statusForRemark, isOpen);

            // Calculate fine based on remark (authoritative source)
            let calculatedFine = 0;
            if (remark === "Unclosed") {
              calculatedFine = monthSettings.fineAmountUnclosed;
              userFines += calculatedFine;
            } else if (remark === "Unopened") {
              calculatedFine = monthSettings.fineAmountUnopened;
              userFines += calculatedFine;
            }
            
            // Only add fineAmount if it's higher than calculated fine (handles manually adjusted fines)
            const storedFine = parseFloat(att.fineAmount || "0");
            if (storedFine > calculatedFine) {
              // Manual fine is higher than calculated, add the difference
              userFines += (storedFine - calculatedFine);
            }
          }
        }
        totalFinesCurrentMonth += userFines;

        // Get payments (transactions) for current month
        const userTransactions = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, user.id),
              gte(transactions.createdAt, currentMonthStart),
              lte(transactions.createdAt, today)
            )
          );

        const userPayments = userTransactions.reduce(
          (sum, txn) => sum + parseFloat(txn.amount || "0"),
          0
        );
        totalPayments += userPayments;

        // Calculate user dues
        const userDues = userBaseExpense + userGuestExpense + userFines - userPayments;
        totalDues += userDues;

        // Track users with unpaid balances
        if (userDues > 0) {
          usersWithUnpaidBalances++;
          topUsersByDues.push({
            userId: user.id,
            userName: user.name,
            dues: userDues,
          });
        }
      } catch (error) {
        // Skip users with calculation errors
        console.error(`Error calculating dues for user ${user.id}:`, error);
        continue;
      }
    }

    // Sort and get top 5 users by dues
    topUsersByDues.sort((a, b) => b.dues - a.dues);
    const top5UsersByDues = topUsersByDues.slice(0, 5);

    const pendingDues = totalDues;

    // ============================================
    // Operational Insights
    // ============================================
    const openMeals = todayMealsBooked;
    const closedMeals = todayMealsClosed;

    // Get recent guests (last 5)
    const recentGuestsData = await db
      .select({
        id: guests.id,
        name: guests.name,
        date: guests.date,
        inviterId: guests.inviterId,
        inviterName: users.name,
      })
      .from(guests)
      .leftJoin(users, eq(guests.inviterId, users.id))
      .orderBy(desc(guests.createdAt))
      .limit(5);

    const recentGuests = recentGuestsData.map((g) => ({
      id: g.id,
      name: g.name,
      date: g.date,
      inviterName: g.inviterName || "Unknown",
    }));

    // Get recent fines (last 50 with fine amount > 0, then take top 5)
    const recentFinesDataRaw = await db
      .select({
        userId: attendance.userId,
        fineAmount: attendance.fineAmount,
        date: attendance.date,
        updatedAt: attendance.updatedAt,
        userName: users.name,
      })
      .from(attendance)
      .leftJoin(users, eq(attendance.userId, users.id))
      .where(eq(attendance.mealType, "Lunch"))
      .orderBy(desc(attendance.updatedAt))
      .limit(50);

    // Filter to only those with fine amount > 0
    const recentFinesData = recentFinesDataRaw
      .filter((f) => parseFloat(f.fineAmount || "0") > 0)
      .slice(0, 5);

    const recentFines = recentFinesData.map((f) => ({
      userId: f.userId || "",
      userName: f.userName || "Unknown",
      amount: parseFloat(f.fineAmount || "0"),
      date: f.date,
    }));

    // ============================================
    // Feedback & Alerts
    // ============================================
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get all feedback
    const allFeedbackData = await db
      .select({
        id: feedback.id,
        title: feedback.title,
        status: feedback.status,
        createdAt: feedback.createdAt,
        userId: feedback.userId,
        userName: users.name,
      })
      .from(feedback)
      .leftJoin(users, eq(feedback.userId, users.id))
      .orderBy(desc(feedback.createdAt));

    // Count new feedback (last 7 days)
    const newFeedbackCount = allFeedbackData.filter((f) => {
      const createdAt = new Date(f.createdAt);
      return createdAt >= sevenDaysAgo;
    }).length;

    // Count pending feedback
    const pendingFeedbackCount = allFeedbackData.filter(
      (f) => f.status === "Pending"
    ).length;

    // Get recent feedback (last 5)
    const recentFeedback = allFeedbackData.slice(0, 5).map((f) => ({
      id: f.id,
      title: f.title,
      status: f.status || "Pending",
      userName: f.userName || "Unknown",
      createdAt: f.createdAt.toISOString(),
    }));

    return NextResponse.json({
      // User stats
      totalUsers,
      activeUsers: activeUsersCount,
      inactiveUsers: inactiveUsersCount,
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

      // Financial Overview (current month)
      financial: {
        totalDues,
        totalPayments,
        pendingDues,
        guestCount: guestCountCurrentMonth,
        totalGuestExpense,
        totalBaseExpense,
        totalFines: totalFinesCurrentMonth,
      },

      // Operational Insights
      operational: {
        openMeals,
        closedMeals,
        usersWithUnpaidBalances,
        topUsersByDues: top5UsersByDues,
        recentGuests,
        recentFines,
      },

      // Feedback & Alerts
      feedback: {
        newCount: newFeedbackCount,
        pendingCount: pendingFeedbackCount,
        recentFeedback,
      },
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

import { db, users, attendance, guests, transactions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { calculateActiveDays, isUserActiveOnDate } from "@/lib/utils/active-days";
import { getSettingForDate } from "@/lib/utils/settings-history";

/**
 * Calculate payable amount for a user from creation to a specific date
 */
export async function calculatePayableAmount(
  userId: string,
  endDate: Date = new Date()
): Promise<{
  baseExpense: number;
  fines: number;
  guestExpenses: number;
  payments: number;
  totalPayable: number;
}> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return {
      baseExpense: 0,
      fines: 0,
      guestExpenses: 0,
      payments: 0,
      totalPayable: 0,
    };
  }

  const userCreatedAt = new Date(user.createdAt);
  const effectiveEndDate =
    user.status === "Active"
      ? endDate
      : new Date(user.updatedAt) < endDate
        ? new Date(user.updatedAt)
        : endDate;

  if (userCreatedAt > effectiveEndDate) {
    return {
      baseExpense: 0,
      fines: 0,
      guestExpenses: 0,
      payments: 0,
      totalPayable: 0,
    };
  }

  // Calculate active days
  const activeDays = await calculateActiveDays(
    userId,
    userCreatedAt,
    effectiveEndDate
  );

  if (activeDays === 0) {
    return {
      baseExpense: 0,
      fines: 0,
      guestExpenses: 0,
      payments: 0,
      totalPayable: 0,
    };
  }

  // Get all settings changes in the date range to optimize
  // For now, calculate day by day (can be optimized later with caching)
  let baseExpense = 0;
  const currentDate = new Date(userCreatedAt);
  currentDate.setHours(0, 0, 0, 0);
  const endDateCopy = new Date(effectiveEndDate);
  endDateCopy.setHours(23, 59, 59, 999);

  // Use a simpler approach: get average monthly expense and calculate
  // This is more efficient than querying for each day
  const today = new Date();
  const monthlyExpensePerHead = await getSettingForDate(
    "monthly_expense_per_head",
    today
  );
  const dailyBaseExpense = parseFloat(monthlyExpensePerHead) / 30;
  baseExpense = dailyBaseExpense * activeDays;

  // Get fines (only from active days)
  const userFines = await db
    .select()
    .from(attendance)
    .where(eq(attendance.userId, userId));

  let totalFines = 0;
  for (const att of userFines) {
    const attDate = new Date(att.date);
    if (attDate >= userCreatedAt && attDate <= effectiveEndDate) {
      const isActive = await isUserActiveOnDate(userId, attDate);
      if (isActive) {
        totalFines += parseFloat(att.fineAmount || "0");
      }
    }
  }

  // Get guest expenses (only from active days)
  const userGuests = await db
    .select()
    .from(guests)
    .where(eq(guests.inviterId, userId));

  let totalGuestExpenses = 0;
  for (const guest of userGuests) {
    const guestDate = new Date(guest.date);
    if (guestDate >= userCreatedAt && guestDate <= effectiveEndDate) {
      const isActive = await isUserActiveOnDate(userId, guestDate);
      if (isActive) {
        totalGuestExpenses += parseFloat(guest.amount || "0");
      }
    }
  }

  // Get all payments
  const userPayments = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId));

  const totalPayments = userPayments.reduce(
    (sum, txn) => sum + parseFloat(txn.amount || "0"),
    0
  );

  const totalPayable = baseExpense + totalFines + totalGuestExpenses - totalPayments;

  return {
    baseExpense,
    fines: totalFines,
    guestExpenses: totalGuestExpenses,
    payments: totalPayments,
    totalPayable: Math.max(0, totalPayable),
  };
}


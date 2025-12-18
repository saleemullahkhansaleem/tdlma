import { NextRequest, NextResponse } from "next/server";
import { db, users, transactions } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { eq, desc } from "drizzle-orm";
import { calculatePayableAmount } from "@/lib/utils/payable-calculation";

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Get all users (active and inactive, but only those who were active at some point)
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.role, "user"))
      .orderBy(users.name);

    // Calculate payable amount for each user
    const usersWithPayments = await Promise.all(
      allUsers.map(async (user) => {
        const payable = await calculatePayableAmount(user.id, today);

        if (payable.totalPayable === 0 && payable.baseExpense === 0) {
          // User has no active days or no expenses, skip
          return null;
        }

        // Get last payment date
        const [lastTransaction] = await db
          .select({
            createdAt: transactions.createdAt,
          })
          .from(transactions)
          .where(eq(transactions.userId, user.id))
          .orderBy(desc(transactions.createdAt))
          .limit(1);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          totalDues: payable.totalPayable,
          lastPaymentDate: lastTransaction?.createdAt || null,
        };
      })
    );

    // Filter out null values (users with no active days)
    const validUsers = usersWithPayments.filter(
      (u): u is NonNullable<typeof u> => u !== null
    );

    return NextResponse.json(validUsers);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching users with dues:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

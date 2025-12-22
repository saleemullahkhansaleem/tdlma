import { NextRequest, NextResponse } from "next/server";
import { db, transactions, users } from "@/lib/db";
import { requireAuth } from "@/lib/middleware/auth";
import { eq, and, desc, gte, lte, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where conditions - always filter by user's own ID
    const conditions = [eq(transactions.userId, user.id)];

    if (startDate) {
      conditions.push(gte(transactions.createdAt, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(transactions.createdAt, end));
    }
    if (type) {
      conditions.push(eq(transactions.type, type as any));
    }

    // Get transactions for this user
    const userTransactions = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        createdBy: transactions.createdBy,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        createdByName: users.name,
        createdByEmail: users.email,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: transactions.id })
      .from(transactions)
      .where(and(...conditions));

    const totalCount = countResult.length;

    // Calculate summary
    const allUserTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.id));

    const summary = {
      totalPaid: allUserTransactions
        .filter((t) => t.type === "paid")
        .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0),
      totalReduced: allUserTransactions
        .filter((t) => t.type === "reduced")
        .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0),
      totalWaived: allUserTransactions
        .filter((t) => t.type === "waived")
        .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0),
    };

    // Format response
    const formattedTransactions = userTransactions.map((txn) => ({
      id: txn.id,
      userId: txn.userId,
      amount: parseFloat(txn.amount || "0"),
      type: txn.type,
      description: txn.description,
      createdBy: txn.createdBy,
      createdByName: txn.createdByName,
      createdByEmail: txn.createdByEmail,
      createdAt: txn.createdAt,
      updatedAt: txn.updatedAt,
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      summary,
      total: totalCount,
      limit,
      offset,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching user transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


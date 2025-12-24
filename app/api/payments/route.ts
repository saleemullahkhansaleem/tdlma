import { NextRequest, NextResponse } from "next/server";
import { db, transactions, users } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { checkAdminPermission } from "@/lib/utils/permissions";
import { eq, and, desc, gte, lte, or, inArray } from "drizzle-orm";
import { sendNotification } from "@/lib/utils/notifications";
import { auditLog } from "@/lib/middleware/audit";

export interface CreatePaymentDto {
  userId: string;
  amount: number;
  type: "paid" | "reduced" | "waived";
  description?: string;
}

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    // Build where conditions
    const conditions = [];
    if (userId) {
      conditions.push(eq(transactions.userId, userId));
    }
    if (startDate) {
      conditions.push(gte(transactions.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(transactions.createdAt, new Date(endDate)));
    }
    if (type) {
      conditions.push(eq(transactions.type, type as any));
    }

    // Get all transactions
    const allTransactionsData = await db
      .select()
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(transactions.createdAt));

    // Get user info for transactions
    const userIds = [...new Set(allTransactionsData.map((t) => t.userId))];
    const createdByIds = [
      ...new Set(allTransactionsData.map((t) => t.createdBy)),
    ];
    const allUserIds = [...new Set([...userIds, ...createdByIds])];

    const allUsersData =
      allUserIds.length > 0
        ? await db
            .select()
            .from(users)
            .where(inArray(users.id, allUserIds))
        : [];

    const usersMap = new Map(allUsersData.map((u) => [u.id, u]));

    // Format transactions with user info
    const allTransactions = allTransactionsData.map((txn) => {
      const user = usersMap.get(txn.userId);
      const createdByUser = usersMap.get(txn.createdBy);
      return {
        ...txn,
        user: user
          ? { id: user.id, name: user.name, email: user.email }
          : null,
        createdByUser: createdByUser
          ? { id: createdByUser.id, name: createdByUser.name, email: createdByUser.email }
          : null,
      };
    });

    // Format response
    const formattedTransactions = allTransactions.map((txn) => ({
      id: txn.id,
      userId: txn.userId,
      user: txn.user,
      amount: parseFloat(txn.amount || "0"),
      type: txn.type,
      description: txn.description,
      createdBy: txn.createdBy,
      createdByUser: txn.createdByUser,
      createdAt: txn.createdAt,
      updatedAt: txn.updatedAt,
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminPermission(request, "payments");
    const body: CreatePaymentDto = await request.json();

    // Validate required fields
    if (!body.userId || !body.amount || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: userId, amount, type" },
        { status: 400 }
      );
    }

    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["paid", "reduced", "waived"].includes(body.type)) {
      return NextResponse.json(
        { error: "Type must be 'paid', 'reduced', or 'waived'" },
        { status: 400 }
      );
    }

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create transaction
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId: body.userId,
        amount: body.amount.toString(),
        type: body.type as any,
        description: body.description || null,
        createdBy: admin.id,
      })
      .returning();

    // Update user's total dues (reduce by payment amount)
    const currentDues = parseFloat(user.totalDues || "0");
    const newDues = Math.max(0, currentDues - body.amount);

    await db
      .update(users)
      .set({
        totalDues: newDues.toString(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, body.userId));

    // Send notification to user
    const typeLabels = {
      paid: "Payment Received",
      reduced: "Amount Reduced",
      waived: "Amount Waived",
    };

    await sendNotification(body.userId, {
      type: "payment_processed",
      title: typeLabels[body.type],
      message: `Your payment of Rs ${body.amount.toFixed(2)} has been processed. Remaining dues: Rs ${newDues.toFixed(2)}`,
      sendEmail: true,
    });

    // Create audit log
    await auditLog(admin, "CREATE_PAYMENT", "transaction", transaction.id, {
      userId: body.userId,
      amount: body.amount,
      type: body.type,
    });

    return NextResponse.json(
      {
        ...transaction,
        amount: parseFloat(transaction.amount || "0"),
        updatedDues: newDues,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}


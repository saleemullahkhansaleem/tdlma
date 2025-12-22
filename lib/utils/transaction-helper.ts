import { db, transactions } from "@/lib/db";
import { AppUser } from "@/lib/auth-context";

export interface CreateTransactionParams {
  userId: string;
  amount: number;
  type: "paid" | "reduced" | "waived";
  description: string;
  createdBy: string; // User ID of the admin/user creating the transaction
}

/**
 * Helper function to automatically create transactions for various financial events
 * @param params - Transaction parameters
 * @returns Created transaction
 */
export async function createTransaction(
  params: CreateTransactionParams
): Promise<typeof transactions.$inferSelect> {
  // Validate amount
  if (params.amount <= 0) {
    throw new Error("Transaction amount must be greater than 0");
  }

  // Validate type
  const validTypes = ["paid", "reduced", "waived"];
  if (!validTypes.includes(params.type)) {
    throw new Error(`Invalid transaction type. Must be one of: ${validTypes.join(", ")}`);
  }

  // Create transaction
  const [transaction] = await db
    .insert(transactions)
    .values({
      userId: params.userId,
      amount: params.amount.toString(),
      type: params.type as any,
      description: params.description || null,
      createdBy: params.createdBy,
    })
    .returning();

  return transaction;
}

/**
 * Create a transaction for a guest expense
 * Note: Using "reduced" type to indicate amount added to user's dues
 */
export async function createGuestExpenseTransaction(
  userId: string,
  guestName: string,
  amount: number,
  date: string,
  createdBy: string
): Promise<typeof transactions.$inferSelect> {
  return createTransaction({
    userId,
    amount,
    type: "reduced", // Using "reduced" to indicate this increases dues (negative from user perspective)
    description: `Guest expense for ${guestName} on ${date}`,
    createdBy,
  });
}

/**
 * Create a transaction for a fine
 * Note: Using "reduced" type to indicate amount added to user's dues
 */
export async function createFineTransaction(
  userId: string,
  fineType: "unclosed" | "unopened",
  amount: number,
  date: string,
  createdBy: string
): Promise<typeof transactions.$inferSelect> {
  return createTransaction({
    userId,
    amount,
    type: "reduced", // Using "reduced" to indicate this increases dues (negative from user perspective)
    description: `Fine for ${fineType} meal on ${date}`,
    createdBy,
  });
}


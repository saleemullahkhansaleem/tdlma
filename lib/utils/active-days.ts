import { db, users, userStatusHistory } from "@/lib/db";
import { eq, and, lte, gte, desc } from "drizzle-orm";

/**
 * Check if a user is active on a specific date
 */
export async function isUserActiveOnDate(
  userId: string,
  date: Date
): Promise<boolean> {
  const dateStr = date.toISOString().split("T")[0];
  const dateTimestamp = new Date(dateStr);
  dateTimestamp.setHours(23, 59, 59, 999);

  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return false;

  // If user was created after this date, they don't exist yet
  if (new Date(user.createdAt) > dateTimestamp) {
    return false;
  }

  // Try to get status history, but fallback if table doesn't exist
  try {
    const [statusHistory] = await db
      .select()
      .from(userStatusHistory)
      .where(
        and(
          eq(userStatusHistory.userId, userId),
          lte(userStatusHistory.changedAt, dateTimestamp)
        )
      )
      .orderBy(desc(userStatusHistory.changedAt))
      .limit(1);

    // If we have history, use it
    if (statusHistory) {
      return statusHistory.status === "Active";
    }
  } catch (error: any) {
    // If table doesn't exist, fallback to current status
    // This handles the case where migration hasn't been run yet
    if (error.message?.includes("does not exist") || error.code === "42P01") {
      // Fallback: if user was created before or on this date and is currently active, assume they were active
      return user.status === "Active";
    }
    throw error;
  }

  // If no history found, use current status
  // This is a fallback - assumes user has been in current status since creation
  return user.status === "Active";
}

/**
 * Calculate active days for a user in a date range
 * Only counts days where user exists AND is active
 */
export async function calculateActiveDays(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return 0;

  // User must exist in the date range
  const userCreatedAt = new Date(user.createdAt);
  const userStart = userCreatedAt > startDate ? userCreatedAt : startDate;
  const userEnd = endDate;

  if (userStart > userEnd) return 0;

  // Get all status changes in the date range
  // Try to get status history, but fallback if table doesn't exist
  let statusChanges: Array<{
    id: string;
    userId: string;
    status: "Active" | "Inactive";
    changedAt: Date;
    changedBy: string;
    createdAt: Date;
  }> = [];

  try {
    statusChanges = await db
      .select()
      .from(userStatusHistory)
      .where(
        and(
          eq(userStatusHistory.userId, userId),
          gte(userStatusHistory.changedAt, userStart),
          lte(userStatusHistory.changedAt, userEnd)
        )
      )
      .orderBy(userStatusHistory.changedAt);
  } catch (error: any) {
    // If table doesn't exist, use empty array (fallback to current status)
    if (error.message?.includes("does not exist") || error.code === "42P01") {
      // Table doesn't exist yet, will use current status as fallback
      statusChanges = [];
    } else {
      throw error;
    }
  }

  // Count active days
  let activeDays = 0;
  const currentDate = new Date(userStart);
  currentDate.setHours(0, 0, 0, 0);

  const endDateCopy = new Date(userEnd);
  endDateCopy.setHours(23, 59, 59, 999);

  // Determine initial status (before first status change in range)
  let currentStatus = user.status;
  if (statusChanges.length > 0) {
    // Get status before the first change in range
    try {
      const [statusBeforeRange] = await db
        .select()
        .from(userStatusHistory)
        .where(
          and(
            eq(userStatusHistory.userId, userId),
            lte(userStatusHistory.changedAt, userStart)
          )
        )
        .orderBy(desc(userStatusHistory.changedAt))
        .limit(1);
      if (statusBeforeRange) {
        currentStatus = statusBeforeRange.status;
      }
    } catch (error: any) {
      // If table doesn't exist, use current status
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        currentStatus = user.status;
      } else {
        throw error;
      }
    }
  }

  // Process each day
  while (currentDate <= endDateCopy) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dateTimestamp = new Date(dateStr);
    dateTimestamp.setHours(23, 59, 59, 999);

    // Check if user was created before or on this date
    if (userCreatedAt <= dateTimestamp) {
      // Check if there's a status change on or before this date
      const relevantChange = statusChanges.find(
        (change) => new Date(change.changedAt) <= dateTimestamp
      );

      if (relevantChange) {
        currentStatus = relevantChange.status;
      }

      // Count if active
      if (currentStatus === "Active") {
        activeDays++;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return activeDays;
}

/**
 * Get the date range where user is active in the given range
 * Returns { start: Date, end: Date } or null if user never active
 */
export async function getActiveDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ start: Date; end: Date } | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const userCreatedAt = new Date(user.createdAt);
  const userStart = userCreatedAt > startDate ? userCreatedAt : startDate;
  const userEnd =
    user.status === "Active"
      ? endDate
      : new Date(user.updatedAt) < endDate
        ? new Date(user.updatedAt)
        : endDate;

  if (userStart > userEnd) return null;

  return { start: userStart, end: userEnd };
}


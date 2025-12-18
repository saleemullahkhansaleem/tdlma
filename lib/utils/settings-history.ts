import { db, settingsHistory, settings } from "@/lib/db";
import { eq, and, lte, desc } from "drizzle-orm";

export type SettingType =
  | "fine_amount_unclosed"
  | "fine_amount_unopened"
  | "guest_meal_amount"
  | "monthly_expense_per_head"
  | "close_time";

/**
 * Get setting value for a specific date from settings_history
 * Falls back to current settings if no history found
 */
export async function getSettingForDate(
  settingType: SettingType,
  date: Date
): Promise<string> {
  const dateStr = date.toISOString().split("T")[0];

  // Try to get from settings history, but fallback if table doesn't exist
  try {
    const [historyEntry] = await db
      .select()
      .from(settingsHistory)
      .where(
        and(
          eq(settingsHistory.settingType, settingType),
          lte(settingsHistory.effectiveDate, dateStr)
        )
      )
      .orderBy(desc(settingsHistory.effectiveDate))
      .limit(1);

    if (historyEntry) {
      return historyEntry.value;
    }
  } catch (error: any) {
    // If table doesn't exist, fallback to current settings
    if (error.message?.includes("does not exist") || error.code === "42P01") {
      // Table doesn't exist yet, will use current settings
    } else {
      throw error;
    }
  }

  // Fall back to current settings
  const [currentSettings] = await db.select().from(settings).limit(1);
  if (!currentSettings) {
    return "0"; // Default fallback
  }

  switch (settingType) {
    case "fine_amount_unclosed":
      return currentSettings.fineAmountUnclosed || "0";
    case "fine_amount_unopened":
      return currentSettings.fineAmountUnopened || "0";
    case "guest_meal_amount":
      return currentSettings.guestMealAmount || "0";
    case "monthly_expense_per_head":
      return currentSettings.monthlyExpensePerHead || "0";
    case "close_time":
      return currentSettings.closeTime || "18:00";
    default:
      return "0";
  }
}

/**
 * Get all settings for a specific date
 */
export async function getAllSettingsForDate(date: Date): Promise<{
  fineAmountUnclosed: number;
  fineAmountUnopened: number;
  guestMealAmount: number;
  monthlyExpensePerHead: number;
  closeTime: string;
}> {
  const [
    fineAmountUnclosed,
    fineAmountUnopened,
    guestMealAmount,
    monthlyExpensePerHead,
    closeTime,
  ] = await Promise.all([
    getSettingForDate("fine_amount_unclosed", date),
    getSettingForDate("fine_amount_unopened", date),
    getSettingForDate("guest_meal_amount", date),
    getSettingForDate("monthly_expense_per_head", date),
    getSettingForDate("close_time", date),
  ]);

  return {
    fineAmountUnclosed: parseFloat(fineAmountUnclosed),
    fineAmountUnopened: parseFloat(fineAmountUnopened),
    guestMealAmount: parseFloat(guestMealAmount),
    monthlyExpensePerHead: parseFloat(monthlyExpensePerHead),
    closeTime,
  };
}


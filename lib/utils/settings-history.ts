import { db, settingsHistory, settings } from "@/lib/db";
import { eq, and, lte, desc, sql, gt, gte, isNull, or } from "drizzle-orm";

export type SettingKey =
  | "fine_amount_unclosed"
  | "fine_amount_unopened"
  | "guest_meal_amount"
  | "monthly_expense_per_head"
  | "close_time";

/**
 * Get setting value for a specific date from settings_history
 * Uses effective_from and effective_to date ranges
 * Returns the value as a string (parsed from JSONB)
 * 
 * Query rules:
 * - effective_from <= date
 * - AND (effective_to IS NULL OR effective_to >= date)
 * - ORDER BY effective_from DESC
 * - LIMIT 1
 */
export async function getSetting(
  key: SettingKey,
  date: Date = new Date()
): Promise<string> {
  const dateStr = date.toISOString().split("T")[0];

  // Try to get from settings history
  try {
    const [historyEntry] = await db
      .select()
      .from(settingsHistory)
      .where(
        and(
          eq(settingsHistory.settingKey, key),
          lte(settingsHistory.effectiveFrom, dateStr),
          or(
            isNull(settingsHistory.effectiveTo),
            gte(settingsHistory.effectiveTo, dateStr)
          )
        )
      )
      .orderBy(desc(settingsHistory.effectiveFrom))
      .limit(1);

    if (historyEntry && historyEntry.value) {
      // Extract value from JSONB
      const value = historyEntry.value;
      if (typeof value === "string") return value;
      if (typeof value === "number") return value.toString();
      if (typeof value === "boolean") return value.toString();
      // If it's an object, try to extract a value property
      if (value && typeof value === "object" && "value" in value) {
        return String((value as any).value);
      }
      return String(value);
    }
  } catch (error: any) {
    // If table doesn't exist or column doesn't exist, fallback to current settings
    if (error.message?.includes("does not exist") || error.code === "42P01" || error.code === "42703") {
      // Will fallback to current settings
    } else {
      throw error;
    }
  }

  // No fallback - all values must come from settings_history
  // If no history entry exists, return default based on setting type
  const [settingDef] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);

  if (settingDef) {
    // Return appropriate default based on value type
    if (settingDef.valueType === "number") return "0";
    if (settingDef.valueType === "time") return "18:00";
    if (settingDef.valueType === "boolean") return "false";
    return "";
  }

  // Default fallback if setting definition doesn't exist
  return "0";
}

/**
 * Get setting value for a specific date from settings_history
 * Falls back to current settings if no history found
 * @deprecated Use getSetting instead. This function is kept for backward compatibility.
 */
export async function getSettingForDate(
  settingType: SettingKey,
  date: Date
): Promise<string> {
  return getSetting(settingType, date);
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

/**
 * Get current settings (for today) in the old format for backward compatibility
 * This helps migrate code that expects the old settings structure
 */
export async function getCurrentSettings(): Promise<{
  closeTime: string;
  fineAmountUnclosed: number;
  fineAmountUnopened: number;
  guestMealAmount: number;
  monthlyExpensePerHead: number;
}> {
  const today = new Date();
  const allSettings = await getAllSettingsForDate(today);
  return {
    closeTime: allSettings.closeTime,
    fineAmountUnclosed: allSettings.fineAmountUnclosed,
    fineAmountUnopened: allSettings.fineAmountUnopened,
    guestMealAmount: allSettings.guestMealAmount,
    monthlyExpensePerHead: allSettings.monthlyExpensePerHead,
  };
}

/**
 * Get future effective dates for settings (settings with effective_from > today)
 */
export async function getFutureSettings(): Promise<{
  monthlyExpensePerHead?: { value: string; effectiveDate: string };
  guestMealAmount?: { value: string; effectiveDate: string };
}> {
  const today = new Date().toISOString().split("T")[0];
  const result: {
    monthlyExpensePerHead?: { value: string; effectiveDate: string };
    guestMealAmount?: { value: string; effectiveDate: string };
  } = {};

  try {
    // Get future monthly expense per head (where effective_from > today)
    const [futureMonthlyExpense] = await db
      .select()
      .from(settingsHistory)
      .where(
        and(
          eq(settingsHistory.settingKey, "monthly_expense_per_head"),
          gt(settingsHistory.effectiveFrom, today)
        )
      )
      .orderBy(settingsHistory.effectiveFrom)
      .limit(1);

    if (futureMonthlyExpense && futureMonthlyExpense.value) {
      const value = futureMonthlyExpense.value;
      const valueStr = typeof value === "string" ? value : 
                      typeof value === "number" ? value.toString() :
                      value && typeof value === "object" && "value" in value ? String((value as any).value) :
                      String(value);
      result.monthlyExpensePerHead = {
        value: valueStr,
        effectiveDate: futureMonthlyExpense.effectiveFrom,
      };
    }

    // Get future guest meal amount (where effective_from > today)
    const [futureGuestMeal] = await db
      .select()
      .from(settingsHistory)
      .where(
        and(
          eq(settingsHistory.settingKey, "guest_meal_amount"),
          gt(settingsHistory.effectiveFrom, today)
        )
      )
      .orderBy(settingsHistory.effectiveFrom)
      .limit(1);

    if (futureGuestMeal && futureGuestMeal.value) {
      const value = futureGuestMeal.value;
      const valueStr = typeof value === "string" ? value : 
                      typeof value === "number" ? value.toString() :
                      value && typeof value === "object" && "value" in value ? String((value as any).value) :
                      String(value);
      result.guestMealAmount = {
        value: valueStr,
        effectiveDate: futureGuestMeal.effectiveFrom,
      };
    }
  } catch (error: any) {
    // If table doesn't exist or column doesn't exist, return empty result
    if (error.message?.includes("does not exist") || error.code === "42P01" || error.code === "42703") {
      return {};
    }
    throw error;
  }

  return result;
}

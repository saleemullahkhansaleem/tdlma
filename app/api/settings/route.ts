import { NextRequest, NextResponse } from "next/server";
import { db, settings, guests, users, settingsHistory } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/middleware/auth";
import { checkAdminPermission } from "@/lib/utils/permissions";
import { UpdateSettingsDto } from "@/lib/types/settings";
import { sql, eq, gte } from "drizzle-orm";
import { auditLog } from "@/lib/middleware/audit";
import { notifyAllUsers } from "@/lib/utils/notifications";
import { getCurrentSettings } from "@/lib/utils/settings-history";

export async function GET(request: NextRequest) {
  try {
    // Allow both admins and regular users to read settings
    requireAuth(request);

    // Get current settings from the new normalized settings system
    const currentSettings = await getCurrentSettings();

    return NextResponse.json({
      closeTime: currentSettings.closeTime,
      fineAmountUnclosed: currentSettings.fineAmountUnclosed,
      fineAmountUnopened: currentSettings.fineAmountUnopened,
      guestMealAmount: currentSettings.guestMealAmount,
      monthlyExpensePerHead: currentSettings.monthlyExpensePerHead,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdminPermission(request, "settings");

    let body: UpdateSettingsDto;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate closeTime format (HH:mm)
    if (body.closeTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(body.closeTime)) {
        return NextResponse.json(
          { error: "closeTime must be in HH:mm format (e.g., 18:00)" },
          { status: 400 }
        );
      }
    }

    // Validate fine amounts
    if (body.fineAmountUnclosed !== undefined && body.fineAmountUnclosed < 0) {
      return NextResponse.json(
        { error: "Fine amount for Unclosed cannot be negative" },
        { status: 400 }
      );
    }

    if (body.fineAmountUnopened !== undefined && body.fineAmountUnopened < 0) {
      return NextResponse.json(
        { error: "Fine amount for Unopened cannot be negative" },
        { status: 400 }
      );
    }

    // Validate guest meal amount
    if (body.guestMealAmount !== undefined && body.guestMealAmount < 0) {
      return NextResponse.json(
        { error: "Guest meal amount cannot be negative" },
        { status: 400 }
      );
    }

    // Validate monthly expense per head
    if (body.monthlyExpensePerHead !== undefined && body.monthlyExpensePerHead < 0) {
      return NextResponse.json(
        { error: "Monthly expense per head cannot be negative" },
        { status: 400 }
      );
    }

    // Validate effective dates are provided for amount changes
    if (body.fineAmountUnclosed !== undefined && !body.fineAmountUnclosedEffectiveDate) {
      return NextResponse.json(
        { error: "Effective date is required when changing fine amount for unclosed meals" },
        { status: 400 }
      );
    }
    if (body.fineAmountUnopened !== undefined && !body.fineAmountUnopenedEffectiveDate) {
      return NextResponse.json(
        { error: "Effective date is required when changing fine amount for unopened meals" },
        { status: 400 }
      );
    }
    if (body.guestMealAmount !== undefined && !body.guestMealAmountEffectiveDate) {
      return NextResponse.json(
        { error: "Effective date is required when changing guest meal amount" },
        { status: 400 }
      );
    }
    if (body.monthlyExpensePerHead !== undefined && !body.monthlyExpensePerHeadEffectiveDate) {
      return NextResponse.json(
        { error: "Effective date is required when changing monthly expense per head" },
        { status: 400 }
      );
    }
    if (body.closeTime !== undefined && !body.closeTimeEffectiveDate) {
      return NextResponse.json(
        { error: "Effective date is required when changing close time" },
        { status: 400 }
      );
    }

    // Validate effective date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const effectiveDates = [
      body.fineAmountUnclosedEffectiveDate,
      body.fineAmountUnopenedEffectiveDate,
      body.guestMealAmountEffectiveDate,
      body.monthlyExpensePerHeadEffectiveDate,
      body.closeTimeEffectiveDate,
    ].filter(Boolean);

    for (const date of effectiveDates) {
      if (date && !dateRegex.test(date)) {
        return NextResponse.json(
          { error: "Effective date must be in YYYY-MM-DD format" },
          { status: 400 }
        );
      }
    }

    // Get current settings to check if values are changing
    const currentSettings = await getCurrentSettings();
    
    // Track if guestMealAmount is changing
    const guestMealAmountChanged = 
      body.guestMealAmount !== undefined && 
      currentSettings.guestMealAmount !== body.guestMealAmount;
    
    // Track if monthlyExpensePerHead is changing
    const monthlyExpensePerHeadChanged = 
      body.monthlyExpensePerHead !== undefined && 
      currentSettings.monthlyExpensePerHead !== body.monthlyExpensePerHead;
    
    // Get today's date for updating future guests
    const today = new Date().toISOString().split("T")[0];

    // Create settings history entries for changed settings
    const historyEntries: Array<{
      settingKey: string;
      value: unknown;
      effectiveFrom: string;
      createdBy: string;
    }> = [];

    if (body.fineAmountUnclosed !== undefined && body.fineAmountUnclosedEffectiveDate) {
      historyEntries.push({
        settingKey: "fine_amount_unclosed",
        value: body.fineAmountUnclosed,
        effectiveFrom: body.fineAmountUnclosedEffectiveDate,
        createdBy: admin.id,
      });
    }
    if (body.fineAmountUnopened !== undefined && body.fineAmountUnopenedEffectiveDate) {
      historyEntries.push({
        settingKey: "fine_amount_unopened",
        value: body.fineAmountUnopened,
        effectiveFrom: body.fineAmountUnopenedEffectiveDate,
        createdBy: admin.id,
      });
    }
    if (body.guestMealAmount !== undefined && body.guestMealAmountEffectiveDate) {
      historyEntries.push({
        settingKey: "guest_meal_amount",
        value: body.guestMealAmount,
        effectiveFrom: body.guestMealAmountEffectiveDate,
        createdBy: admin.id,
      });
    }
    if (body.monthlyExpensePerHead !== undefined && body.monthlyExpensePerHeadEffectiveDate) {
      historyEntries.push({
        settingKey: "monthly_expense_per_head",
        value: body.monthlyExpensePerHead,
        effectiveFrom: body.monthlyExpensePerHeadEffectiveDate,
        createdBy: admin.id,
      });
    }
    if (body.closeTime !== undefined && body.closeTimeEffectiveDate) {
      historyEntries.push({
        settingKey: "close_time",
        value: body.closeTime,
        effectiveFrom: body.closeTimeEffectiveDate,
        createdBy: admin.id,
      });
    }

    // Insert settings history entries
    if (historyEntries.length > 0) {
      await db.insert(settingsHistory).values(historyEntries);
    }

    // If guestMealAmount changed, update future guests only (from effective date onward)
    if (guestMealAmountChanged && body.guestMealAmount !== undefined && body.guestMealAmountEffectiveDate) {
      await db
        .update(guests)
        .set({ 
          amount: body.guestMealAmount.toString(),
          updatedAt: new Date()
        })
        .where(gte(guests.date, body.guestMealAmountEffectiveDate));
    }

    // Notify users about settings changes
    const changes: string[] = [];
    if (body.fineAmountUnclosed !== undefined) {
      const oldValue = currentSettings.fineAmountUnclosed;
      const newValue = body.fineAmountUnclosed;
      if (oldValue !== newValue) {
        changes.push(`Fine for unclosed meals: Rs ${oldValue.toFixed(2)} → Rs ${newValue.toFixed(2)}`);
      }
    }
    if (body.fineAmountUnopened !== undefined) {
      const oldValue = currentSettings.fineAmountUnopened;
      const newValue = body.fineAmountUnopened;
      if (oldValue !== newValue) {
        changes.push(`Fine for unopened meals: Rs ${oldValue.toFixed(2)} → Rs ${newValue.toFixed(2)}`);
      }
    }
    if (body.guestMealAmount !== undefined) {
      const oldValue = currentSettings.guestMealAmount;
      const newValue = body.guestMealAmount;
      if (oldValue !== newValue) {
        changes.push(`Guest meal amount: Rs ${oldValue.toFixed(2)} → Rs ${newValue.toFixed(2)}`);
      }
    }
    if (monthlyExpensePerHeadChanged && body.monthlyExpensePerHead !== undefined) {
      const oldValue = currentSettings.monthlyExpensePerHead;
      const newValue = body.monthlyExpensePerHead;
      changes.push(`Monthly base expense: Rs ${oldValue.toFixed(2)} → Rs ${newValue.toFixed(2)}`);
    }
    if (body.closeTime !== undefined) {
      const oldValue = currentSettings.closeTime;
      const newValue = body.closeTime;
      if (oldValue !== newValue) {
        changes.push(`Meal close time: ${oldValue} → ${newValue}`);
      }
    }

    if (changes.length > 0) {
      await notifyAllUsers({
        type: "settings_updated",
        title: "Settings Updated",
        message: `The following settings have been updated:\n${changes.join("\n")}`,
        sendEmail: true,
      });
    }

    // Create audit log (use a placeholder ID since we're not storing in settings table anymore)
    await auditLog(admin, "UPDATE_SETTINGS", "settings", undefined, {
      guestMealAmountChanged,
      monthlyExpensePerHeadChanged,
      changes,
    });

    // Return current settings after update
    const finalSettings = await getCurrentSettings();
    return NextResponse.json({
      closeTime: finalSettings.closeTime,
      fineAmountUnclosed: finalSettings.fineAmountUnclosed,
      fineAmountUnopened: finalSettings.fineAmountUnopened,
      guestMealAmount: finalSettings.guestMealAmount,
      monthlyExpensePerHead: finalSettings.monthlyExpensePerHead,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

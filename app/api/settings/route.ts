import { NextRequest, NextResponse } from "next/server";
import { db, settings, guests, users, settingsHistory } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/middleware/auth";
import { UpdateSettingsDto } from "@/lib/types/settings";
import { sql, eq, gte } from "drizzle-orm";
import { auditLog } from "@/lib/middleware/audit";
import { notifyAllUsers } from "@/lib/utils/notifications";

export async function GET(request: NextRequest) {
  try {
    // Allow both admins and regular users to read settings
    requireAuth(request);

    // Get the single settings row (or create default if none exists)
    let [settingsRow] = await db.select().from(settings).limit(1);

    if (!settingsRow) {
      // Create default settings
      [settingsRow] = await db
        .insert(settings)
        .values({
          closeTime: "18:00",
          fineAmountUnclosed: "0",
          fineAmountUnopened: "0",
          guestMealAmount: "0",
          monthlyExpensePerHead: "0",
        })
        .returning();
    }

    return NextResponse.json({
      id: settingsRow.id,
      closeTime: settingsRow.closeTime,
      fineAmountUnclosed: parseFloat(settingsRow.fineAmountUnclosed || "0"),
      fineAmountUnopened: parseFloat(settingsRow.fineAmountUnopened || "0"),
      guestMealAmount: parseFloat(settingsRow.guestMealAmount || "0"),
      monthlyExpensePerHead: parseFloat(settingsRow.monthlyExpensePerHead || "0"),
      createdAt: settingsRow.createdAt,
      updatedAt: settingsRow.updatedAt,
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
    const admin = requireAdmin(request);

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

    // Get or create settings
    let [existingSettings] = await db.select().from(settings).limit(1);
    
    // Track if guestMealAmount is changing
    const guestMealAmountChanged = 
      body.guestMealAmount !== undefined && 
      existingSettings &&
      parseFloat(existingSettings.guestMealAmount || "0") !== body.guestMealAmount;
    
    // Track if monthlyExpensePerHead is changing
    const monthlyExpensePerHeadChanged = 
      body.monthlyExpensePerHead !== undefined && 
      existingSettings &&
      parseFloat(existingSettings.monthlyExpensePerHead || "0") !== body.monthlyExpensePerHead;
    
    // Get today's date for updating future guests
    const today = new Date().toISOString().split("T")[0];

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.closeTime !== undefined) {
      updateData.closeTime = body.closeTime;
    }
    if (body.fineAmountUnclosed !== undefined) {
      updateData.fineAmountUnclosed = body.fineAmountUnclosed.toString();
    }
    if (body.fineAmountUnopened !== undefined) {
      updateData.fineAmountUnopened = body.fineAmountUnopened.toString();
    }
    if (body.guestMealAmount !== undefined) {
      updateData.guestMealAmount = body.guestMealAmount.toString();
    }
    if (body.monthlyExpensePerHead !== undefined) {
      updateData.monthlyExpensePerHead = body.monthlyExpensePerHead.toString();
    }

    let updatedSettings;
    if (existingSettings) {
      [updatedSettings] = await db
        .update(settings)
        .set(updateData)
        .where(sql`1=1`) // Update the single row
        .returning();
    } else {
      [updatedSettings] = await db
        .insert(settings)
        .values({
          closeTime: body.closeTime || "18:00",
          fineAmountUnclosed: (body.fineAmountUnclosed || 0).toString(),
          fineAmountUnopened: (body.fineAmountUnopened || 0).toString(),
          guestMealAmount: (body.guestMealAmount || 0).toString(),
          monthlyExpensePerHead: (body.monthlyExpensePerHead || 0).toString(),
        })
        .returning();
    }

    // Create settings history entries for changed settings
    const historyEntries: Array<{
      settingType: string;
      value: string;
      effectiveDate: string;
    }> = [];

    if (body.fineAmountUnclosed !== undefined && body.fineAmountUnclosedEffectiveDate) {
      historyEntries.push({
        settingType: "fine_amount_unclosed",
        value: body.fineAmountUnclosed.toString(),
        effectiveDate: body.fineAmountUnclosedEffectiveDate,
      });
    }
    if (body.fineAmountUnopened !== undefined && body.fineAmountUnopenedEffectiveDate) {
      historyEntries.push({
        settingType: "fine_amount_unopened",
        value: body.fineAmountUnopened.toString(),
        effectiveDate: body.fineAmountUnopenedEffectiveDate,
      });
    }
    if (body.guestMealAmount !== undefined && body.guestMealAmountEffectiveDate) {
      historyEntries.push({
        settingType: "guest_meal_amount",
        value: body.guestMealAmount.toString(),
        effectiveDate: body.guestMealAmountEffectiveDate,
      });
    }
    if (body.monthlyExpensePerHead !== undefined && body.monthlyExpensePerHeadEffectiveDate) {
      historyEntries.push({
        settingType: "monthly_expense_per_head",
        value: body.monthlyExpensePerHead.toString(),
        effectiveDate: body.monthlyExpensePerHeadEffectiveDate,
      });
    }
    if (body.closeTime !== undefined && body.closeTimeEffectiveDate) {
      historyEntries.push({
        settingType: "close_time",
        value: body.closeTime,
        effectiveDate: body.closeTimeEffectiveDate,
      });
    }

    // Insert settings history entries
    if (historyEntries.length > 0) {
      await db.insert(settingsHistory).values(
        historyEntries.map((entry) => ({
          settingType: entry.settingType,
          value: entry.value,
          effectiveDate: entry.effectiveDate,
          createdBy: admin.id,
        }))
      );
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
    if (body.fineAmountUnclosed !== undefined && existingSettings) {
      const oldValue = parseFloat(existingSettings.fineAmountUnclosed || "0");
      const newValue = body.fineAmountUnclosed;
      if (oldValue !== newValue) {
        changes.push(`Fine for unclosed meals: Rs ${oldValue.toFixed(2)} → Rs ${newValue.toFixed(2)}`);
      }
    }
    if (body.fineAmountUnopened !== undefined && existingSettings) {
      const oldValue = parseFloat(existingSettings.fineAmountUnopened || "0");
      const newValue = body.fineAmountUnopened;
      if (oldValue !== newValue) {
        changes.push(`Fine for unopened meals: Rs ${oldValue.toFixed(2)} → Rs ${newValue.toFixed(2)}`);
      }
    }
    if (body.guestMealAmount !== undefined && existingSettings) {
      const oldValue = parseFloat(existingSettings.guestMealAmount || "0");
      const newValue = body.guestMealAmount;
      if (oldValue !== newValue) {
        changes.push(`Guest meal amount: Rs ${oldValue.toFixed(2)} → Rs ${newValue.toFixed(2)}`);
      }
    }
    if (monthlyExpensePerHeadChanged && body.monthlyExpensePerHead !== undefined) {
      const oldValue = parseFloat(existingSettings.monthlyExpensePerHead || "0");
      const newValue = body.monthlyExpensePerHead;
      changes.push(`Monthly base expense: Rs ${oldValue.toFixed(2)} → Rs ${newValue.toFixed(2)}`);
    }
    if (body.closeTime !== undefined && existingSettings) {
      const oldValue = existingSettings.closeTime;
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

    // Create audit log
    await auditLog(admin, "UPDATE_SETTINGS", "settings", updatedSettings.id, {
      updatedFields: Object.keys(updateData),
      guestMealAmountChanged,
      monthlyExpensePerHeadChanged,
    });

    return NextResponse.json({
      id: updatedSettings.id,
      closeTime: updatedSettings.closeTime,
      fineAmountUnclosed: parseFloat(updatedSettings.fineAmountUnclosed || "0"),
      fineAmountUnopened: parseFloat(updatedSettings.fineAmountUnopened || "0"),
      guestMealAmount: parseFloat(updatedSettings.guestMealAmount || "0"),
      monthlyExpensePerHead: parseFloat(updatedSettings.monthlyExpensePerHead || "0"),
      createdAt: updatedSettings.createdAt,
      updatedAt: updatedSettings.updatedAt,
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

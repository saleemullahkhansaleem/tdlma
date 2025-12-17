import { NextRequest, NextResponse } from "next/server";
import { db, settings, guests } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/middleware/auth";
import { UpdateSettingsDto } from "@/lib/types/settings";
import { sql, eq, gte } from "drizzle-orm";
import { auditLog } from "@/lib/middleware/audit";

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
        })
        .returning();
    }

    return NextResponse.json({
      id: settingsRow.id,
      closeTime: settingsRow.closeTime,
      fineAmountUnclosed: parseFloat(settingsRow.fineAmountUnclosed || "0"),
      fineAmountUnopened: parseFloat(settingsRow.fineAmountUnopened || "0"),
      guestMealAmount: parseFloat(settingsRow.guestMealAmount || "0"),
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

    // Get or create settings
    let [existingSettings] = await db.select().from(settings).limit(1);
    
    // Track if guestMealAmount is changing
    const guestMealAmountChanged = 
      body.guestMealAmount !== undefined && 
      existingSettings &&
      parseFloat(existingSettings.guestMealAmount || "0") !== body.guestMealAmount;
    
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
        })
        .returning();
    }

    // If guestMealAmount changed, update future guests only (from today onward)
    if (guestMealAmountChanged && body.guestMealAmount !== undefined) {
      await db
        .update(guests)
        .set({ 
          amount: body.guestMealAmount.toString(),
          updatedAt: new Date()
        })
        .where(gte(guests.date, today));
    }

    // Create audit log
    await auditLog(admin, "UPDATE_SETTINGS", "settings", updatedSettings.id, {
      updatedFields: Object.keys(updateData),
      guestMealAmountChanged,
    });

    return NextResponse.json({
      id: updatedSettings.id,
      closeTime: updatedSettings.closeTime,
      fineAmountUnclosed: parseFloat(updatedSettings.fineAmountUnclosed || "0"),
      fineAmountUnopened: parseFloat(updatedSettings.fineAmountUnopened || "0"),
      guestMealAmount: parseFloat(updatedSettings.guestMealAmount || "0"),
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

import { NextRequest, NextResponse } from "next/server";
import { db, settings, settingsHistory, guests } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { sql, eq, gte, and, isNull } from "drizzle-orm";
import { auditLog } from "@/lib/middleware/audit";
import { notifyAllUsers } from "@/lib/utils/notifications";

export async function PATCH(request: NextRequest) {
  try {
    const admin = requireAdmin(request);

    let body: {
      setting_key: string;
      value: string | number | boolean;
      effective_from: string;
    };
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.setting_key || body.value === undefined || !body.effective_from) {
      return NextResponse.json(
        { error: "Missing required fields: setting_key, value, effective_from" },
        { status: 400 }
      );
    }

    // Validate effective date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.effective_from)) {
      return NextResponse.json(
        { error: "Effective date must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    // Validate effective date is not in the past
    const today = new Date().toISOString().split("T")[0];
    if (body.effective_from < today) {
      return NextResponse.json(
        { error: "Effective date cannot be in the past" },
        { status: 400 }
      );
    }

    // Validate setting_key exists in settings
    const [settingType] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, body.setting_key))
      .limit(1);

    if (!settingType) {
      return NextResponse.json(
        { error: `Setting key "${body.setting_key}" does not exist` },
        { status: 400 }
      );
    }

    // Validate value based on value_type
    let validatedValue: string | number | boolean;
    if (settingType.valueType === "number") {
      const numValue = typeof body.value === "number" ? body.value : parseFloat(String(body.value));
      if (isNaN(numValue) || numValue < 0) {
        return NextResponse.json(
          { error: `${body.setting_key} must be a non-negative number` },
          { status: 400 }
        );
      }
      validatedValue = numValue;
    } else if (settingType.valueType === "time") {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const timeValue = String(body.value);
      if (!timeRegex.test(timeValue)) {
        return NextResponse.json(
          { error: `${body.setting_key} must be in HH:mm format (e.g., 18:00)` },
          { status: 400 }
        );
      }
      validatedValue = timeValue;
    } else if (settingType.valueType === "boolean") {
      validatedValue = Boolean(body.value);
    } else {
      // string type
      validatedValue = String(body.value);
    }

    // Find the currently active setting (effective_to IS NULL)
    const [activeSetting] = await db
      .select()
      .from(settingsHistory)
      .where(
        and(
          eq(settingsHistory.settingKey, body.setting_key),
          isNull(settingsHistory.effectiveTo)
        )
      )
      .limit(1);

    // If there's an active setting, close it by setting effective_to = effective_from - 1 day
    if (activeSetting) {
      // Calculate the day before the new effective date
      const effectiveFromDate = new Date(body.effective_from);
      effectiveFromDate.setDate(effectiveFromDate.getDate() - 1);
      const effectiveToDate = effectiveFromDate.toISOString().split("T")[0];

      // Validate no overlapping ranges
      // Check if there's already a setting with this effective_from date
      const [existingSetting] = await db
        .select()
        .from(settingsHistory)
        .where(
          and(
            eq(settingsHistory.settingKey, body.setting_key),
            eq(settingsHistory.effectiveFrom, body.effective_from)
          )
        )
        .limit(1);

      if (existingSetting) {
        return NextResponse.json(
          { error: `A setting with effective date ${body.effective_from} already exists for ${body.setting_key}` },
          { status: 400 }
        );
      }

      // Close the active setting
      await db
        .update(settingsHistory)
        .set({
          effectiveTo: effectiveToDate,
        })
        .where(eq(settingsHistory.id, activeSetting.id));
    }

    // Insert new settings history entry with effective_from
    await db.insert(settingsHistory).values({
      settingKey: body.setting_key,
      value: validatedValue as any, // JSONB accepts any JSON-serializable value
      effectiveFrom: body.effective_from,
      effectiveTo: null, // NULL means currently active
      createdBy: admin.id,
    });

    // If guest_meal_amount changed and effective date is today or in the past, update future guests
    if (body.setting_key === "guest_meal_amount" && body.effective_from <= today) {
      const amountValue = typeof validatedValue === "number" ? validatedValue.toString() : String(validatedValue);
      await db
        .update(guests)
        .set({ 
          amount: amountValue,
          updatedAt: new Date()
        })
        .where(gte(guests.date, body.effective_from));
    }

    // Get old value for notification
    let oldValue: string | number = "0";
    if (activeSetting && activeSetting.value) {
      const value = activeSetting.value;
      if (typeof value === "string") oldValue = value;
      else if (typeof value === "number") oldValue = value;
      else if (typeof value === "boolean") oldValue = value.toString();
      else if (value && typeof value === "object" && "value" in value) {
        oldValue = String((value as any).value);
      } else {
        oldValue = String(value);
      }
    }

    // Notify users about the change
    const unit = settingType.unit ? ` ${settingType.unit}` : "";
    const changeMessage = settingType.valueType === "time"
      ? `${settingType.description}: ${oldValue} → ${validatedValue} (effective from ${body.effective_from})`
      : `${settingType.description}:${unit} ${oldValue} → ${validatedValue} (effective from ${body.effective_from})`;

    await notifyAllUsers({
      type: "settings_updated",
      title: "Settings Updated",
      message: changeMessage,
      sendEmail: true,
    });

    // Create audit log
    await auditLog(admin, "UPDATE_SETTINGS", "settings_history", body.setting_key, {
      setting_key: body.setting_key,
      oldValue: String(oldValue),
      newValue: String(validatedValue),
      effective_from: body.effective_from,
    });

    return NextResponse.json({
      success: true,
      setting_key: body.setting_key,
      value: validatedValue,
      effective_from: body.effective_from,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error updating settings field:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

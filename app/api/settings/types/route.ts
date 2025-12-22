import { NextRequest, NextResponse } from "next/server";
import { db, settings, settingsHistory } from "@/lib/db";
import { requireAuth } from "@/lib/middleware/auth";
import { eq, and, isNull, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    // Get all settings types
    let types = await db.select().from(settings).orderBy(settings.key);

    // If no settings exist, seed default settings
    if (types.length === 0) {
      try {
        await db.insert(settings).values([
          {
            key: "close_time",
            description: "Time after which users cannot change meal status",
            unit: "HH:mm",
            valueType: "time",
          },
          {
            key: "fine_amount_unclosed",
            description: "Fine amount for unclosed meals",
            unit: "Rs",
            valueType: "number",
          },
          {
            key: "fine_amount_unopened",
            description: "Fine amount for unopened meals",
            unit: "Rs",
            valueType: "number",
          },
          {
            key: "guest_meal_amount",
            description: "Amount charged per guest meal",
            unit: "Rs",
            valueType: "number",
          },
          {
            key: "monthly_expense_per_head",
            description: "Monthly base expense per user",
            unit: "Rs",
            valueType: "number",
          },
        ]);
        
        // Fetch again after seeding
        types = await db.select().from(settings).orderBy(settings.key);
      } catch (seedError: any) {
        console.error("Error seeding default settings:", seedError);
        // Continue even if seeding fails
      }
    }

    // Get current values for each setting type
    const typesWithValues = await Promise.all(
      types.map(async (type) => {
        // Get the currently active value (effective_to IS NULL)
        const [activeValue] = await db
          .select()
          .from(settingsHistory)
          .where(
            and(
              eq(settingsHistory.settingKey, type.key),
              isNull(settingsHistory.effectiveTo)
            )
          )
          .orderBy(desc(settingsHistory.effectiveFrom))
          .limit(1);

        let currentValue: string | number | boolean = "";
        if (activeValue && activeValue.value) {
          const value = activeValue.value;
          if (typeof value === "string") currentValue = value;
          else if (typeof value === "number") currentValue = value;
          else if (typeof value === "boolean") currentValue = value;
          else if (value && typeof value === "object" && "value" in value) {
            currentValue = String((value as any).value);
          } else {
            currentValue = String(value);
          }
        } else {
          // Set default values if no history exists
          if (type.valueType === "number") currentValue = 0;
          else if (type.valueType === "time") currentValue = "18:00";
          else if (type.valueType === "boolean") currentValue = false;
          else currentValue = "";
        }

        return {
          ...type,
          currentValue,
        };
      })
    );

    return NextResponse.json(typesWithValues);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching settings types:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


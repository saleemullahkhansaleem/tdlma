import { NextRequest, NextResponse } from "next/server";
import { db, settings, settingsHistory, users } from "@/lib/db";
import { requireAuth } from "@/lib/middleware/auth";
import { eq, and, isNull, desc, gt, or, lte, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    const today = new Date().toISOString().split("T")[0];

    // Get all settings types
    const settingsTypes = await db.select().from(settings).orderBy(settings.key);

    // Get current settings (effective_to IS NULL and effective_from <= today)
    const currentSettings = await Promise.all(
      settingsTypes.map(async (type) => {
        const [activeValue] = await db
          .select({
            value: settingsHistory.value,
            effectiveFrom: settingsHistory.effectiveFrom,
            createdBy: settingsHistory.createdBy,
            createdAt: settingsHistory.createdAt,
          })
          .from(settingsHistory)
          .where(
            and(
              eq(settingsHistory.settingKey, type.key),
              lte(settingsHistory.effectiveFrom, today),
              or(
                isNull(settingsHistory.effectiveTo),
                gte(settingsHistory.effectiveTo, today)
              )
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

        // Get creator info
        let creatorName = null;
        let creatorEmail = null;
        if (activeValue?.createdBy) {
          const [creator] = await db
            .select({
              name: users.name,
              email: users.email,
            })
            .from(users)
            .where(eq(users.id, activeValue.createdBy))
            .limit(1);
          if (creator) {
            creatorName = creator.name;
            creatorEmail = creator.email;
          }
        }

        return {
          key: type.key,
          description: type.description,
          unit: type.unit,
          valueType: type.valueType,
          currentValue,
          effectiveFrom: activeValue?.effectiveFrom || null,
          lastUpdated: activeValue?.createdAt || null,
          updatedBy: creatorName || creatorEmail || null,
        };
      })
    );

    // Get upcoming settings changes (effective_from > today)
    const upcomingSettings = await Promise.all(
      settingsTypes.map(async (type) => {
        const [futureValue] = await db
          .select({
            value: settingsHistory.value,
            effectiveFrom: settingsHistory.effectiveFrom,
            createdBy: settingsHistory.createdBy,
            createdAt: settingsHistory.createdAt,
          })
          .from(settingsHistory)
          .where(
            and(
              eq(settingsHistory.settingKey, type.key),
              gt(settingsHistory.effectiveFrom, today)
            )
          )
          .orderBy(settingsHistory.effectiveFrom)
          .limit(1);

        if (!futureValue) return null;

        let futureValueParsed: string | number | boolean = "";
        const value = futureValue.value;
        if (typeof value === "string") futureValueParsed = value;
        else if (typeof value === "number") futureValueParsed = value;
        else if (typeof value === "boolean") futureValueParsed = value;
        else if (value && typeof value === "object" && "value" in value) {
          futureValueParsed = String((value as any).value);
        } else {
          futureValueParsed = String(value);
        }

        // Get creator info
        let creatorName = null;
        let creatorEmail = null;
        if (futureValue.createdBy) {
          const [creator] = await db
            .select({
              name: users.name,
              email: users.email,
            })
            .from(users)
            .where(eq(users.id, futureValue.createdBy))
            .limit(1);
          if (creator) {
            creatorName = creator.name;
            creatorEmail = creator.email;
          }
        }

        return {
          key: type.key,
          description: type.description,
          unit: type.unit,
          valueType: type.valueType,
          newValue: futureValueParsed,
          effectiveFrom: futureValue.effectiveFrom,
          createdBy: creatorName || creatorEmail || null,
          createdAt: futureValue.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      current: currentSettings,
      upcoming: upcomingSettings.filter((s) => s !== null) as Array<{
        key: string;
        description: string;
        unit: string | null;
        valueType: string;
        newValue: string | number | boolean;
        effectiveFrom: string;
        createdBy: string | null;
        createdAt: string;
      }>,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching current settings:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


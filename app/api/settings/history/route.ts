import { NextRequest, NextResponse } from "next/server";
import { db, settingsHistory, settings, users } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const settingKey = searchParams.get("settingKey");

    // Build query conditionally
    let history;
    if (settingKey) {
      history = await db
        .select({
          id: settingsHistory.id,
          settingKey: settingsHistory.settingKey,
          value: settingsHistory.value,
          effectiveFrom: settingsHistory.effectiveFrom,
          effectiveTo: settingsHistory.effectiveTo,
          createdBy: settingsHistory.createdBy,
          createdAt: settingsHistory.createdAt,
          creatorName: users.name,
          creatorEmail: users.email,
        })
        .from(settingsHistory)
        .leftJoin(users, eq(settingsHistory.createdBy, users.id))
        .where(eq(settingsHistory.settingKey, settingKey))
        .orderBy(desc(settingsHistory.effectiveFrom));
    } else {
      history = await db
        .select({
          id: settingsHistory.id,
          settingKey: settingsHistory.settingKey,
          value: settingsHistory.value,
          effectiveFrom: settingsHistory.effectiveFrom,
          effectiveTo: settingsHistory.effectiveTo,
          createdBy: settingsHistory.createdBy,
          createdAt: settingsHistory.createdAt,
          creatorName: users.name,
          creatorEmail: users.email,
        })
        .from(settingsHistory)
        .leftJoin(users, eq(settingsHistory.createdBy, users.id))
        .orderBy(desc(settingsHistory.effectiveFrom));
    }

    // Get settings for descriptions
    const types = await db.select().from(settings);
    const typesMap = new Map(types.map((t) => [t.key, t]));

    // Transform to include active status and format values
    const historyWithActive = history.map((entry) => {
      // Extract value from JSONB
      let valueStr = "";
      if (entry.value) {
        const value = entry.value;
        if (typeof value === "string") valueStr = value;
        else if (typeof value === "number") valueStr = value.toString();
        else if (typeof value === "boolean") valueStr = value.toString();
        else if (value && typeof value === "object" && "value" in value) {
          valueStr = String((value as any).value);
        } else {
          valueStr = String(value);
        }
      }

      const settingType = typesMap.get(entry.settingKey);
      return {
        ...entry,
        value: valueStr,
        description: settingType?.description || entry.settingKey,
        unit: settingType?.unit || null,
        valueType: settingType?.valueType || "string",
        isActive: entry.effectiveTo === null,
      };
    });

    return NextResponse.json(historyWithActive);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching settings history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

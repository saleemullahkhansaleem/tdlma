import { NextRequest, NextResponse } from "next/server";
import { db, attendance, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";

// This endpoint should be called by Vercel Cron Jobs or an external cron service
// Configure in vercel.json or use Vercel Cron Jobs dashboard
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron job (optional security check)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Get all users with role "user"
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "user"));

    // Meal types to create attendance for
    // For now, only create Lunch records
    const mealTypes: ("Breakfast" | "Lunch" | "Dinner")[] = ["Lunch"];

    let createdCount = 0;
    let skippedCount = 0;

    // Create attendance records for each user and meal type
    for (const user of allUsers) {
      for (const mealType of mealTypes) {
        // Check if attendance already exists for this user, date, and meal type
        const [existing] = await db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.userId, user.id),
              eq(attendance.date, today),
              eq(attendance.mealType, mealType as any)
            )
          )
          .limit(1);

        if (existing) {
          skippedCount++;
          continue;
        }

        // Create attendance record with null status and isOpen = true (default)
        await db.insert(attendance).values({
          userId: user.id,
          date: today,
          mealType: mealType as any,
          status: undefined, // Use undefined for nullable enum in Drizzle
          isOpen: true, // Default to open
        });

        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      created: createdCount,
      skipped: skippedCount,
      total: allUsers.length * mealTypes.length,
    });
  } catch (error: any) {
    console.error("Error creating daily attendance:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db, attendance, users, offDays } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { isWeekend, isOffDay } from "@/lib/utils";

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

    // Get all active users with role "user" (exclude inactive users)
    const allUsers = await db
      .select()
      .from(users)
      .where(and(eq(users.role, "user"), eq(users.status, "Active")));

    // Get all off-days
    const allOffDays = await db.select().from(offDays);
    const offDayDates = allOffDays.map((od) => od.date);

    // Check if today is a weekend or off-day
    const todayIsWeekend = isWeekend(today);
    const todayIsOffDay = isOffDay(today, offDayDates);

    // Meal types to create attendance for
    // For now, only create Lunch records
    const mealTypes: ("Breakfast" | "Lunch" | "Dinner")[] = ["Lunch"];

    let createdCount = 0;
    let skippedCount = 0;
    let markedOffCount = 0;

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

        // Determine if attendance should be marked OFF
        // Mark OFF if: weekend, off-day, or user is inactive (but we already filtered inactive users)
        const shouldMarkOff = todayIsWeekend || todayIsOffDay;

        if (existing) {
          // If existing record and it's a holiday/weekend, update it to be OFF
          if (shouldMarkOff && (existing.status !== "Absent" || existing.isOpen !== false)) {
            await db
              .update(attendance)
              .set({
                status: "Absent" as any,
                isOpen: false,
                updatedAt: new Date(),
              })
              .where(eq(attendance.id, existing.id));
            markedOffCount++;
          } else {
            skippedCount++;
          }
          continue;
        }

        // Create attendance record
        // If should mark off, set status = "Absent" and isOpen = false
        // Otherwise, set status = null and isOpen = true (default)
        await db.insert(attendance).values({
          userId: user.id,
          date: today,
          mealType: mealType as any,
          status: shouldMarkOff ? ("Absent" as any) : undefined,
          isOpen: !shouldMarkOff, // false if marking off, true otherwise
        });

        if (shouldMarkOff) {
          markedOffCount++;
        } else {
          createdCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      created: createdCount,
      markedOff: markedOffCount,
      skipped: skippedCount,
      total: allUsers.length * mealTypes.length,
      isWeekend: todayIsWeekend,
      isOffDay: todayIsOffDay,
    });
  } catch (error: any) {
    console.error("Error creating daily attendance:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

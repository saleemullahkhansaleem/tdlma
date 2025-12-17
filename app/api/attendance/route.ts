import { NextRequest, NextResponse } from "next/server";
import {
  db,
  attendance,
  users,
  guests,
  settings as settingsTable,
} from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/middleware/auth";
import { CreateAttendanceDto } from "@/lib/types/attendance";
import { eq, and, sql, lte } from "drizzle-orm";
import { calculateRemark } from "@/lib/utils";
import { auditLog } from "@/lib/middleware/audit";

export async function GET(request: NextRequest) {
  try {
    const authUser = requireAuth(request);
    const { searchParams } = new URL(request.url);

    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];
    // Always use "Lunch" meal type for now
    const mealType = "Lunch";

    // Check if user is admin or regular user
    const isAdmin =
      authUser.role === "admin" || authUser.role === "super_admin";

    // Get all users created on or before the selected date
    // Convert date string to Date object for comparison
    const selectedDateObj = new Date(date);
    selectedDateObj.setHours(23, 59, 59, 999); // End of the selected day

    // If admin, get all active users. If regular user, only get their own data (if active)
    const allUsers = isAdmin
      ? await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.role, "user"),
              eq(users.status, "Active"),
              lte(users.createdAt, selectedDateObj)
            )
          )
      : await db
          .select()
          .from(users)
          .where(
            and(eq(users.id, authUser.id), eq(users.status, "Active"))
          );

    // Get attendance for the date and meal type
    const attendanceRecords = await db
      .select({
        id: attendance.id,
        userId: attendance.userId,
        date: attendance.date,
        mealType: attendance.mealType,
        status: attendance.status,
        isOpen: attendance.isOpen,
        fineAmount: attendance.fineAmount,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      })
      .from(attendance)
      .where(
        and(eq(attendance.date, date), eq(attendance.mealType, mealType as any))
      );

    // Get guest counts for each user on this date
    const guestCounts = await db
      .select({
        inviterId: guests.inviterId,
        count: sql<number>`count(*)::int`,
      })
      .from(guests)
      .where(and(eq(guests.date, date), eq(guests.mealType, mealType as any)))
      .groupBy(guests.inviterId);

    const guestCountMap = new Map(
      guestCounts.map((gc) => [gc.inviterId, gc.count])
    );

    // Combine users with their attendance
    // If a user doesn't have an attendance record, create one with null status
    const attendanceWithUsers = await Promise.all(
      allUsers.map(async (user) => {
        let attendanceRecord = attendanceRecords.find(
          (a) => a.userId === user.id
        );

        // If no attendance record exists, create one with null status and isOpen = true
        if (!attendanceRecord) {
          try {
            const [newRecord] = await db
              .insert(attendance)
              .values({
                userId: user.id,
                date,
                mealType: mealType as any,
                status: undefined, // Use undefined for nullable enum in Drizzle
                isOpen: true, // Default to open
              })
              .returning();
            attendanceRecord = newRecord;
          } catch (insertError: any) {
            // If insert fails (e.g., race condition), try to fetch again
            console.error(
              `Failed to create attendance for user ${user.id}:`,
              insertError
            );
            const [existing] = await db
              .select()
              .from(attendance)
              .where(
                and(
                  eq(attendance.userId, user.id),
                  eq(attendance.date, date),
                  eq(attendance.mealType, mealType as any)
                )
              )
              .limit(1);
            if (existing) {
              attendanceRecord = existing;
            } else {
              throw insertError;
            }
          }
        }

        const status =
          attendanceRecord.status === "Present" ||
          attendanceRecord.status === "Absent"
            ? attendanceRecord.status
            : null;
        const isOpen = attendanceRecord.isOpen ?? true; // Default to true if not set
        const remark = calculateRemark(status, isOpen);

        return {
          id: attendanceRecord.id,
          userId: user.id,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
          },
          date,
          mealType,
          status,
          isOpen,
          remark,
          fineAmount: attendanceRecord.fineAmount || "0",
          guestCount: guestCountMap.get(user.id) || 0,
          createdAt: attendanceRecord.createdAt,
          updatedAt: attendanceRecord.updatedAt,
        };
      })
    );

    return NextResponse.json(attendanceWithUsers);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching attendance:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const body: CreateAttendanceDto = await request.json();

    // Validate required fields (status is optional, can be null)
    if (!body.userId || !body.date || !body.mealType) {
      return NextResponse.json(
        { error: "Missing required fields: userId, date, mealType" },
        { status: 400 }
      );
    }

    // Check if attendance already exists
    const [existing] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, body.userId),
          eq(attendance.date, body.date),
          eq(attendance.mealType, body.mealType as any)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        {
          error: "Attendance already exists for this user, date, and meal type",
        },
        { status: 409 }
      );
    }

    // Default isOpen to true if not provided
    const isOpen = body.isOpen !== undefined ? body.isOpen : true;

    // Get settings to calculate fine
    const [settingsData] = await db.select().from(settingsTable).limit(1);

    // Calculate remark and fine amount
    const statusForRemark =
      body.status === "Present" || body.status === "Absent"
        ? body.status
        : null;
    const remark = calculateRemark(statusForRemark, isOpen);

    // Calculate fine based on remark
    let calculatedFine = "0";
    if (settingsData) {
      if (remark === "Unclosed") {
        calculatedFine = settingsData.fineAmountUnclosed || "0";
      } else if (remark === "Unopened") {
        calculatedFine = settingsData.fineAmountUnopened || "0";
      }
      // "All Clear" or null means no fine
    }

    // Create attendance (remark is computed, not stored, but fine is stored)
    const [newAttendance] = await db
      .insert(attendance)
      .values({
        userId: body.userId,
        date: body.date,
        mealType: body.mealType as any,
        status: body.status ? (body.status as any) : undefined,
        isOpen: isOpen,
        fineAmount: calculatedFine,
      })
      .returning();

    // Calculate remark for response (computed from status and isOpen)
    const status =
      newAttendance.status === "Present" || newAttendance.status === "Absent"
        ? newAttendance.status
        : null;
    const computedRemark = calculateRemark(
      status,
      newAttendance.isOpen ?? true
    );

    // Add computed remark to response
    const response = {
      ...newAttendance,
      remark: computedRemark,
    };

    // Create audit log
    await auditLog(admin, "CREATE_ATTENDANCE", "attendance", newAttendance.id, {
      userId: body.userId,
      date: body.date,
      mealType: body.mealType,
      status: body.status,
      isOpen: isOpen,
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error creating attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

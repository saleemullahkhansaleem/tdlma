import { NextRequest, NextResponse } from "next/server";
import { db, attendance, settings } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/middleware/auth";
import { UpdateAttendanceDto } from "@/lib/types/attendance";
import { eq } from "drizzle-orm";
import { calculateRemark } from "@/lib/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Allow both admin and regular users to update attendance (for isOpen toggle)
    const user = requireAuth(request);
    const { id: attendanceId } = await params;

    let body: UpdateAttendanceDto;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Check if attendance exists
    const [existingAttendance] = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, attendanceId))
      .limit(1);

    if (!existingAttendance) {
      return NextResponse.json(
        { error: "Attendance not found" },
        { status: 404 }
      );
    }

    // Check if user is updating their own attendance or is an admin
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    if (!isAdmin && existingAttendance.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only update your own attendance" },
        { status: 403 }
      );
    }

    // Update attendance
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Determine the final status and isOpen values after update
    const finalStatus =
      body.status !== undefined && isAdmin
        ? body.status === null
          ? null
          : body.status
        : existingAttendance.status;
    const finalIsOpen =
      body.isOpen !== undefined
        ? body.isOpen
        : existingAttendance.isOpen ?? true;

    // Only admins can update status (including setting to null)
    if (body.status !== undefined && isAdmin) {
      updateData.status = body.status === null ? null : body.status;
    }

    // Users can toggle isOpen, admins can also set it
    if (body.isOpen !== undefined) {
      updateData.isOpen = body.isOpen;
    }

    // Calculate and set fine amount automatically based on remark
    // Only calculate if status or isOpen changed (not if fineAmount is manually set)
    if (
      body.fineAmount === undefined &&
      (body.status !== undefined || body.isOpen !== undefined)
    ) {
      // Get settings to calculate fine
      const [settingsData] = await db.select().from(settings).limit(1);

      if (settingsData) {
        // Calculate remark from final status and isOpen
        const statusForRemark =
          finalStatus === "Present" || finalStatus === "Absent"
            ? finalStatus
            : null;
        const remark = calculateRemark(statusForRemark, finalIsOpen);

        // Calculate fine based on remark
        let calculatedFine = "0";
        if (remark === "Unclosed") {
          calculatedFine = settingsData.fineAmountUnclosed || "0";
        } else if (remark === "Unopened") {
          calculatedFine = settingsData.fineAmountUnopened || "0";
        }
        // "All Clear" or null means no fine (stays "0")

        updateData.fineAmount = calculatedFine;
      } else {
        // If no settings found, set fine to 0
        updateData.fineAmount = "0";
      }
    } else if (body.fineAmount !== undefined && isAdmin) {
      // Only admins can manually set fine amount
      updateData.fineAmount = body.fineAmount.toString();
    }

    // remark is computed, not stored - no need to update it in DB

    const [updatedAttendance] = await db
      .update(attendance)
      .set(updateData)
      .where(eq(attendance.id, attendanceId))
      .returning();

    if (!updatedAttendance) {
      return NextResponse.json(
        { error: "Failed to update attendance" },
        { status: 500 }
      );
    }

    // Calculate remark for response (computed from status and isOpen)
    const status =
      updatedAttendance.status === "Present" ||
      updatedAttendance.status === "Absent"
        ? updatedAttendance.status
        : null;
    const computedRemark = calculateRemark(
      status,
      updatedAttendance.isOpen ?? true
    );

    // Add computed remark to response
    const response = {
      ...updatedAttendance,
      remark: computedRemark,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = requireAdmin(request);
    const { id: attendanceId } = await params;

    // Check if attendance exists
    const [existingAttendance] = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, attendanceId))
      .limit(1);

    if (!existingAttendance) {
      return NextResponse.json(
        { error: "Attendance not found" },
        { status: 404 }
      );
    }

    // Delete attendance
    await db.delete(attendance).where(eq(attendance.id, attendanceId));

    return NextResponse.json({ message: "Attendance deleted successfully" });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error deleting attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

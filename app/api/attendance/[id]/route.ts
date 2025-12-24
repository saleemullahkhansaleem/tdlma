import { NextRequest, NextResponse } from "next/server";
import { db, attendance } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/middleware/auth";
import { checkAdminPermission } from "@/lib/utils/permissions";
import { UpdateAttendanceDto } from "@/lib/types/attendance";
import { eq } from "drizzle-orm";
import { calculateRemark } from "@/lib/utils";
import { auditLog } from "@/lib/middleware/audit";
import { sendNotification } from "@/lib/utils/notifications";
import { getAllSettingsForDate } from "@/lib/utils/settings-history";
import { createFineTransaction } from "@/lib/utils/transaction-helper";

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
      // Get settings to calculate fine (use attendance date)
      const attendanceDate = new Date(existingAttendance.date);
      const settingsData = await getAllSettingsForDate(attendanceDate);

      // Calculate remark from final status and isOpen
      const statusForRemark =
        finalStatus === "Present" || finalStatus === "Absent"
          ? finalStatus
          : null;
      const remark = calculateRemark(statusForRemark, finalIsOpen);

      // Calculate fine based on remark
      let calculatedFine = "0";
      if (remark === "Unclosed") {
        calculatedFine = settingsData.fineAmountUnclosed.toString();
      } else if (remark === "Unopened") {
        calculatedFine = settingsData.fineAmountUnopened.toString();
      }
      // "All Clear" or null means no fine (stays "0")

      updateData.fineAmount = calculatedFine;
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

    // Create audit log if admin updated it
    if (isAdmin && (body.status !== undefined || body.isOpen !== undefined)) {
      await auditLog(user, "UPDATE_ATTENDANCE", "attendance", attendanceId, {
        status: body.status,
        isOpen: body.isOpen,
        userId: existingAttendance.userId,
      });
    }

    // Send notifications and create transactions
    const oldFine = parseFloat(existingAttendance.fineAmount || "0");
    const newFine = parseFloat(updatedAttendance.fineAmount || "0");

    // Notify if fine was added or increased
    if (newFine > oldFine && newFine > 0) {
      const fineDate = new Date(updatedAttendance.date).toLocaleDateString();
      await sendNotification(existingAttendance.userId, {
        type: "fine_added",
        title: "Fine Added",
        message: `Fine of Rs ${newFine.toFixed(2)} has been added for ${fineDate}. Reason: ${computedRemark || "Unspecified"}`,
        sendEmail: true,
      });

      // Create transaction for the fine increase
      try {
        const fineIncrease = newFine - oldFine;
        const fineType = computedRemark === "Unclosed" ? "unclosed" : "unopened";
        await createFineTransaction(
          existingAttendance.userId,
          fineType,
          fineIncrease,
          updatedAttendance.date,
          user.id
        );
      } catch (transactionError) {
        // Log error but don't fail the attendance update
        console.error("Failed to create transaction for fine:", transactionError);
      }
    }

    // Notify if meal was closed/opened by admin
    if (isAdmin && body.isOpen !== undefined) {
      const wasOpen = existingAttendance.isOpen ?? true;
      const nowOpen = updatedAttendance.isOpen ?? true;
      if (wasOpen !== nowOpen) {
        const mealDate = new Date(updatedAttendance.date).toLocaleDateString();
        await sendNotification(existingAttendance.userId, {
          type: "meal_status_changed",
          title: "Meal Status Changed",
          message: `Meal has been ${nowOpen ? "opened" : "closed"} by admin for ${mealDate}`,
          sendEmail: true,
        });
      }
    }

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
    const admin = await checkAdminPermission(request, "mark_attendance");
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

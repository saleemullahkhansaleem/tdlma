import { NextRequest, NextResponse } from "next/server";
import { db, attendance } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/middleware/auth";
import { UpdateAttendanceDto } from "@/lib/types/attendance";
import { eq } from "drizzle-orm";

// Helper function to auto-generate remark based on status and isOpen
function generateRemark(
  status: "Present" | "Absent" | null,
  isOpen: boolean
): "All Clear" | "Unclosed" | "Unopened" | null {
  if (status === null) return null;

  if (status === "Present" && isOpen) {
    return "All Clear";
  }
  if (status === "Absent" && !isOpen) {
    return "All Clear";
  }
  if (status === "Absent" && isOpen) {
    return "Unclosed";
  }
  if (status === "Present" && !isOpen) {
    return "Unopened";
  }

  return null;
}

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

    // Only admins can update status
    if (body.status !== undefined && isAdmin) {
      updateData.status = body.status;
    }

    // Users can toggle isOpen, admins can also set it
    if (body.isOpen !== undefined) {
      updateData.isOpen = body.isOpen;
    }

    // Auto-generate remark ONLY if status is NOT null
    // If status is null, don't generate or update remark (clear it if it exists)
    const finalStatus =
      body.status !== undefined ? body.status : existingAttendance.status;
    const finalIsOpen =
      body.isOpen !== undefined
        ? body.isOpen
        : existingAttendance.isOpen ?? true;

    // Handle remark generation/clearing
    if (body.remark !== undefined && isAdmin) {
      // Only admins can manually set remark
      updateData.remark = body.remark;
    } else if (
      finalStatus !== null &&
      finalStatus !== undefined &&
      (body.status !== undefined || body.isOpen !== undefined)
    ) {
      // Only generate remark if status is set (not null) AND (status is being updated OR isOpen is being updated)
      const autoRemark = generateRemark(
        finalStatus as "Present" | "Absent",
        finalIsOpen
      );
      updateData.remark = autoRemark; // Can be null, which is fine
    } else if (
      (finalStatus === null || finalStatus === undefined) &&
      (body.status !== undefined || body.isOpen !== undefined)
    ) {
      // If status is null and we're updating, clear the remark
      updateData.remark = null;
    }

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

    return NextResponse.json(updatedAttendance);
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

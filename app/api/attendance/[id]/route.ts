import { NextRequest, NextResponse } from "next/server";
import { db, attendance } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { UpdateAttendanceDto } from "@/lib/types/attendance";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = requireAdmin(request);
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

    // Update attendance
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.remark !== undefined) {
      updateData.remark = body.remark;
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

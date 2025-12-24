import { NextRequest, NextResponse } from "next/server";
import { db, offDays } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { checkAdminPermission } from "@/lib/utils/permissions";
import { UpdateOffDayDto } from "@/lib/types/off-days";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminPermission(request, "off_days");
    const { id } = await params;

    const [offDay] = await db
      .select()
      .from(offDays)
      .where(eq(offDays.id, id))
      .limit(1);

    if (!offDay) {
      return NextResponse.json({ error: "Off day not found" }, { status: 404 });
    }

    return NextResponse.json(offDay);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching off day:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminPermission(request, "off_days");
    const { id } = await params;

    let body: UpdateOffDayDto;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Check if off day exists
    const [existing] = await db
      .select()
      .from(offDays)
      .where(eq(offDays.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Off day not found" }, { status: 404 });
    }

    // Validate date format if provided
    if (body.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(body.date)) {
        return NextResponse.json(
          { error: "Invalid date format. Expected YYYY-MM-DD" },
          { status: 400 }
        );
      }

      // Validate date is in the future
      const dateObj = new Date(body.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateObj <= today) {
        return NextResponse.json(
          { error: "Only future dates can be selected for off days" },
          { status: 400 }
        );
      }

      // Check if new date conflicts with another off day
      const [conflicting] = await db
        .select()
        .from(offDays)
        .where(eq(offDays.date, body.date))
        .limit(1);

      if (conflicting && conflicting.id !== id) {
        return NextResponse.json(
          { error: "An off day already exists for this date" },
          { status: 409 }
        );
      }
    }

    // Validate reason if provided
    if (body.reason !== undefined) {
      const trimmedReason = body.reason.trim();
      if (trimmedReason.length === 0) {
        return NextResponse.json(
          { error: "Reason cannot be empty" },
          { status: 400 }
        );
      }

      // Validate reason is 1-3 words
      const words = trimmedReason
        .split(/\s+/)
        .filter((word) => word.length > 0);
      if (words.length < 1 || words.length > 3) {
        return NextResponse.json(
          { error: "Reason must be 1 to 3 words only" },
          { status: 400 }
        );
      }
    }

    // Update off day
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.date !== undefined) {
      updateData.date = body.date;
    }
    if (body.reason !== undefined) {
      updateData.reason = body.reason.trim();
    }

    const [updated] = await db
      .update(offDays)
      .set(updateData)
      .where(eq(offDays.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update off day" },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Handle unique constraint violation
    if (error.message?.includes("unique") || error.code === "23505") {
      return NextResponse.json(
        { error: "An off day already exists for this date" },
        { status: 409 }
      );
    }
    console.error("Error updating off day:", error);
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
    const admin = await checkAdminPermission(request, "off_days");
    const { id } = await params;

    // Check if off day exists
    const [existing] = await db
      .select()
      .from(offDays)
      .where(eq(offDays.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Off day not found" }, { status: 404 });
    }

    // Delete off day
    await db.delete(offDays).where(eq(offDays.id, id));

    return NextResponse.json({ message: "Off day deleted successfully" });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error deleting off day:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

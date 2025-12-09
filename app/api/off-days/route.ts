import { NextRequest, NextResponse } from "next/server";
import { db, offDays } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/middleware/auth";
import { CreateOffDayDto } from "@/lib/types/off-days";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Allow both admins and regular users to read off days
    requireAuth(request);

    const allOffDays = await db
      .select()
      .from(offDays)
      .orderBy(desc(offDays.date));

    return NextResponse.json(allOffDays);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching off days:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request);

    let body: CreateOffDayDto;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.date || !body.reason) {
      return NextResponse.json(
        { error: "Missing required fields: date, reason" },
        { status: 400 }
      );
    }

    // Validate date format
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

    // Validate reason is not empty
    const trimmedReason = body.reason.trim();
    if (trimmedReason.length === 0) {
      return NextResponse.json(
        { error: "Reason cannot be empty" },
        { status: 400 }
      );
    }

    // Validate reason is 1-3 words
    const words = trimmedReason.split(/\s+/).filter((word) => word.length > 0);
    if (words.length < 1 || words.length > 3) {
      return NextResponse.json(
        { error: "Reason must be 1 to 3 words only" },
        { status: 400 }
      );
    }

    // Check if date already exists
    const [existing] = await db
      .select()
      .from(offDays)
      .where(eq(offDays.date, body.date))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An off day already exists for this date" },
        { status: 409 }
      );
    }

    // Create off day
    const [created] = await db
      .insert(offDays)
      .values({
        date: body.date,
        reason: trimmedReason,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
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
    console.error("Error creating off day:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

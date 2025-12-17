import { NextRequest, NextResponse } from "next/server";
import { db, notifications } from "@/lib/db";
import { requireAuth } from "@/lib/middleware/auth";
import { UpdateNotificationDto } from "@/lib/types/notification";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id: notificationId } = await params;

    let body: UpdateNotificationDto;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Check if notification exists and belongs to user
    const [existing] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, user.id)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Update notification
    const updateData: any = {};
    if (body.read !== undefined) {
      updateData.read = body.read;
    }

    const [updated] = await db
      .update(notifications)
      .set(updateData)
      .where(eq(notifications.id, notificationId))
      .returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




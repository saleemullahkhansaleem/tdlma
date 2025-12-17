import { NextRequest, NextResponse } from "next/server";
import { db, notifications } from "@/lib/db";
import { requireAuth } from "@/lib/middleware/auth";
import { CreateNotificationDto } from "@/lib/types/notification";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);

    // Get user's notifications, ordered by most recent first
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt));

    return NextResponse.json(userNotifications);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching notifications:", error);
    
    // Provide more details in development
    const errorMessage = process.env.NODE_ENV === "development" 
      ? error.message || "Internal server error"
      : "Internal server error";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only admins can create notifications
    const admin = requireAuth(request);
    const isAdmin = admin.role === "admin" || admin.role === "super_admin";
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: CreateNotificationDto = await request.json();

    // Validate required fields
    if (!body.userId || !body.type || !body.title || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields: userId, type, title, message" },
        { status: 400 }
      );
    }

    // Create notification
    const [created] = await db
      .insert(notifications)
      .values({
        userId: body.userId,
        type: body.type,
        title: body.title,
        message: body.message,
        read: false,
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
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




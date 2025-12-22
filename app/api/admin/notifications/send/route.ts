import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { eq, and, or, inArray } from "drizzle-orm";
import { sendNotification as sendNotificationUtil, notifyAllUsers, notifyAllAdmins } from "@/lib/utils/notifications";

export interface SendNotificationDto {
  title: string;
  message: string;
  recipientType: "all_users" | "all_consumers" | "specific_users" | "students" | "employees" | "admins";
  userIds?: string[];
  sendEmail?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const body: SendNotificationDto = await request.json();

    // Validate required fields
    if (!body.title || !body.message || !body.recipientType) {
      return NextResponse.json(
        { error: "Missing required fields: title, message, recipientType" },
        { status: 400 }
      );
    }

    // Validate specific_users requires userIds
    if (body.recipientType === "specific_users" && (!body.userIds || body.userIds.length === 0)) {
      return NextResponse.json(
        { error: "userIds is required when recipientType is 'specific_users'" },
        { status: 400 }
      );
    }

    const sendEmail = body.sendEmail !== false; // Default to true

    let recipientIds: string[] = [];
    let notificationCount = 0;

    // Determine recipient list based on recipientType
    switch (body.recipientType) {
      case "all_users": {
        const allUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.role, "user"), eq(users.status, "Active")));
        recipientIds = allUsers.map((u) => u.id);
        await notifyAllUsers({
          type: "admin_notification",
          title: body.title,
          message: body.message,
          sendEmail,
        });
        notificationCount = recipientIds.length;
        break;
      }

      case "all_consumers": {
        // All consumers: users with role="user" and status="Active" (excludes admins and super_admins)
        const allConsumers = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.role, "user"), eq(users.status, "Active")));
        recipientIds = allConsumers.map((u) => u.id);
        await notifyAllUsers({
          type: "admin_notification",
          title: body.title,
          message: body.message,
          sendEmail,
        });
        notificationCount = recipientIds.length;
        break;
      }

      case "specific_users": {
        if (!body.userIds || body.userIds.length === 0) {
          return NextResponse.json(
            { error: "userIds is required for specific_users" },
            { status: 400 }
          );
        }
        recipientIds = body.userIds;
        // Send to each specific user
        for (const userId of recipientIds) {
          await sendNotificationUtil(userId, {
            type: "admin_notification",
            title: body.title,
            message: body.message,
            sendEmail,
          });
        }
        notificationCount = recipientIds.length;
        break;
      }

      case "students": {
        const students = await db
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.role, "user"),
              eq(users.status, "Active"),
              eq(users.userType, "student")
            )
          );
        recipientIds = students.map((u) => u.id);
        for (const userId of recipientIds) {
          await sendNotificationUtil(userId, {
            type: "admin_notification",
            title: body.title,
            message: body.message,
            sendEmail,
          });
        }
        notificationCount = recipientIds.length;
        break;
      }

      case "employees": {
        const employees = await db
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.role, "user"),
              eq(users.status, "Active"),
              eq(users.userType, "employee")
            )
          );
        recipientIds = employees.map((u) => u.id);
        for (const userId of recipientIds) {
          await sendNotificationUtil(userId, {
            type: "admin_notification",
            title: body.title,
            message: body.message,
            sendEmail,
          });
        }
        notificationCount = recipientIds.length;
        break;
      }

      case "admins": {
        const admins = await db
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              or(eq(users.role, "admin"), eq(users.role, "super_admin")),
              eq(users.status, "Active")
            )
          );
        recipientIds = admins.map((u) => u.id);
        await notifyAllAdmins({
          type: "admin_notification",
          title: body.title,
          message: body.message,
          sendEmail,
        });
        notificationCount = recipientIds.length;
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid recipientType" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Notifications sent to ${notificationCount} recipient(s)`,
      count: notificationCount,
      recipientIds,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error sending notifications:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}


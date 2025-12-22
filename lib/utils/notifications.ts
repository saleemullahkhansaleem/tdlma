import { db, notifications, users, notificationPreferences } from "@/lib/db";
import { eq, or } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

export interface NotificationOptions {
  type: string;
  title: string;
  message: string;
  sendEmail?: boolean;
}

/**
 * Get notification preference for a given type
 */
async function getNotificationPreference(type: string): Promise<{
  enabled: boolean;
  sendEmail: boolean;
} | null> {
  try {
    const [pref] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.notificationType, type))
      .limit(1);

    if (pref) {
      return {
        enabled: pref.enabled,
        sendEmail: pref.sendEmail,
      };
    }
  } catch (error) {
    // If table doesn't exist yet, return null (defaults to enabled)
    console.warn("Notification preferences table may not exist:", error);
  }

  // Default: enabled with email if preference not found
  return { enabled: true, sendEmail: true };
}

/**
 * Send notification to a single user (in-app and optionally email)
 */
export async function sendNotification(
  userId: string,
  options: NotificationOptions
): Promise<void> {
  const { type, title, message, sendEmail: shouldSendEmail = true } = options;

  // Check notification preference
  const preference = await getNotificationPreference(type);
  if (preference && !preference.enabled) {
    // Notification is disabled, don't send
    return;
  }

  // Determine if email should be sent
  const sendEmailNotification =
    shouldSendEmail && preference?.sendEmail !== false;

  // Create in-app notification
  await db.insert(notifications).values({
    userId,
    type,
    title,
    message,
    read: false,
  });

  // Send email notification if requested and enabled
  if (sendEmailNotification) {
    try {
      const [user] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user) {
        await sendNotificationEmail(user.email, user.name || "User", title, message);
      }
    } catch (error) {
      // Log error but don't fail the notification creation
      console.error("Failed to send email notification:", error);
    }
  }
}

/**
 * Send notification to all users (in-app and optionally email)
 */
export async function notifyAllUsers(
  options: NotificationOptions
): Promise<void> {
  const { type, title, message, sendEmail: shouldSendEmail = true } = options;

  // Check notification preference
  const preference = await getNotificationPreference(type);
  if (preference && !preference.enabled) {
    // Notification is disabled, don't send
    return;
  }

  // Determine if email should be sent
  const sendEmailNotification =
    shouldSendEmail && preference?.sendEmail !== false;

  // Get all active users
  const allUsers = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.status, "Active"));

  // Create in-app notifications for all users
  if (allUsers.length > 0) {
    await db.insert(notifications).values(
      allUsers.map((user) => ({
        userId: user.id,
        type,
        title,
        message,
        read: false,
      }))
    );

    // Send email notifications if requested and enabled
    if (sendEmailNotification) {
      for (const user of allUsers) {
        try {
          await sendNotificationEmail(
            user.email,
            user.name || "User",
            title,
            message
          );
        } catch (error) {
          // Log error but continue with other users
          console.error(`Failed to send email to ${user.email}:`, error);
        }
      }
    }
  }
}

/**
 * Send notification to all admins (in-app and optionally email)
 */
export async function notifyAllAdmins(
  options: NotificationOptions
): Promise<void> {
  const { type, title, message, sendEmail: shouldSendEmail = true } = options;

  // Check notification preference
  const preference = await getNotificationPreference(type);
  if (preference && !preference.enabled) {
    // Notification is disabled, don't send
    return;
  }

  // Determine if email should be sent
  const sendEmailNotification =
    shouldSendEmail && preference?.sendEmail !== false;

  // Get all admins (admin and super_admin roles)
  const allAdmins = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(
      or(eq(users.role, "admin"), eq(users.role, "super_admin"))
    );

  // Create in-app notifications for all admins
  if (allAdmins.length > 0) {
    await db.insert(notifications).values(
      allAdmins.map((admin) => ({
        userId: admin.id,
        type,
        title,
        message,
        read: false,
      }))
    );

    // Send email notifications if requested and enabled
    if (sendEmailNotification) {
      for (const admin of allAdmins) {
        try {
          await sendNotificationEmail(
            admin.email,
            admin.name || "Admin",
            title,
            message
          );
        } catch (error) {
          // Log error but continue with other admins
          console.error(`Failed to send email to ${admin.email}:`, error);
        }
      }
    }
  }
}

/**
 * Send email notification
 */
async function sendNotificationEmail(
  email: string,
  userName: string,
  title: string,
  message: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #2563eb; margin-top: 0;">${title}</h2>
          <p>Hello ${userName},</p>
          <p>${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated message from <strong>food.tensaidevs.com</strong>, please do not reply.
          </p>
          <p style="font-size: 11px; color: #bbb; text-align: center; margin-top: 10px;">
            Domain: food.tensaidevs.com
          </p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: title,
    html,
  });
}


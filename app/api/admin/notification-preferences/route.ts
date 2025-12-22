import { NextRequest, NextResponse } from "next/server";
import { db, notificationPreferences, icons } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/middleware/auth";
import { eq } from "drizzle-orm";

// Default notification types with descriptions, icons, and recipient types
const DEFAULT_NOTIFICATION_TYPES = [
  { type: "password_changed", description: "User password changed by user", iconName: "Key", recipientType: "user" },
  { type: "password_changed_by_admin", description: "User password changed by admin", iconName: "KeyRound", recipientType: "user" },
  { type: "guest_added", description: "Guest added to meal", iconName: "UserPlus", recipientType: "user" },
  { type: "fine_added", description: "Fine added for meal", iconName: "AlertCircle", recipientType: "user" },
  { type: "meal_status_changed", description: "Meal status changed (opened/closed)", iconName: "UtensilsCrossed", recipientType: "user" },
  { type: "payment_processed", description: "Payment processed (paid/reduced/waived)", iconName: "CreditCard", recipientType: "user" },
  { type: "settings_updated", description: "System settings updated", iconName: "Settings", recipientType: "all" },
  { type: "menu_updated", description: "Menu updated", iconName: "ChefHat", recipientType: "all" },
  { type: "menu_created", description: "Menu created", iconName: "Utensils", recipientType: "all" },
  { type: "feedback_received", description: "Feedback received (admin notification)", iconName: "MessageSquare", recipientType: "admin" },
  { type: "feedback_responded", description: "Feedback responded to", iconName: "MessageSquareReply", recipientType: "user" },
  { type: "feedback_status_changed", description: "Feedback status changed", iconName: "MessageSquareMore", recipientType: "user" },
  { type: "admin_notification", description: "Custom admin notification", iconName: "Bell", recipientType: "all" },
];

export async function GET(request: NextRequest) {
  try {
    requireSuperAdmin(request);

    // Ensure icons exist for all notification types
    for (const nt of DEFAULT_NOTIFICATION_TYPES) {
      const [existingIcon] = await db
        .select()
        .from(icons)
        .where(eq(icons.name, `notification_${nt.type}`))
        .limit(1);

      if (!existingIcon) {
        await db.insert(icons).values({
          name: `notification_${nt.type}`,
          iconName: nt.iconName,
          category: "notification",
          description: `Icon for ${nt.type} notification`,
        });
      }
    }

    // Get all notification preferences
    const preferences = await db
      .select()
      .from(notificationPreferences)
      .orderBy(notificationPreferences.notificationType);

    // Get all icons
    const allIcons = await db.select().from(icons);
    const iconMap = new Map(allIcons.map((icon) => [icon.id, icon]));

    // Map preferences with icons
    const preferencesWithIcons = preferences.map((pref) => ({
      ...pref,
      icon: pref.iconId ? iconMap.get(pref.iconId) || null : null,
    }));

    // If no preferences exist, create defaults
    if (preferencesWithIcons.length === 0) {
      // Get icon IDs
      const iconMap = new Map<string, string>();
      for (const nt of DEFAULT_NOTIFICATION_TYPES) {
        const [icon] = await db
          .select()
          .from(icons)
          .where(eq(icons.name, `notification_${nt.type}`))
          .limit(1);
        if (icon) iconMap.set(nt.type, icon.id);
      }

      const defaultPrefs = DEFAULT_NOTIFICATION_TYPES.map((nt) => ({
        notificationType: nt.type,
        description: nt.description,
        recipientType: nt.recipientType || "all",
        iconId: iconMap.get(nt.type) || null,
        enabled: true,
        sendEmail: true,
      }));

      await db.insert(notificationPreferences).values(defaultPrefs);
      
      // Return the newly created preferences with icons
      const created = await db
        .select()
        .from(notificationPreferences)
        .orderBy(notificationPreferences.notificationType);
      
      const createdWithIcons = created.map((pref) => ({
        ...pref,
        icon: pref.iconId ? iconMap.get(pref.iconId) || null : null,
      }));
      
      return NextResponse.json(createdWithIcons);
    }

    // Ensure all default types exist
    const existingTypes = new Set(preferencesWithIcons.map((p) => p.notificationType));
    const missingTypes = DEFAULT_NOTIFICATION_TYPES.filter(
      (nt) => !existingTypes.has(nt.type)
    );

    if (missingTypes.length > 0) {
      // Get icon IDs for missing types
      const iconMap = new Map<string, string>();
      for (const nt of missingTypes) {
        const [icon] = await db
          .select()
          .from(icons)
          .where(eq(icons.name, `notification_${nt.type}`))
          .limit(1);
        if (icon) iconMap.set(nt.type, icon.id);
      }

      const newPrefs = missingTypes.map((nt) => ({
        notificationType: nt.type,
        description: nt.description,
        recipientType: nt.recipientType || "all",
        iconId: iconMap.get(nt.type) || null,
        enabled: true,
        sendEmail: true,
      }));

      await db.insert(notificationPreferences).values(newPrefs);
      
      // Refresh preferences and icons after insert
      const updatedPreferences = await db
        .select()
        .from(notificationPreferences)
        .orderBy(notificationPreferences.notificationType);
      
      const updatedIcons = await db.select().from(icons);
      const updatedIconMap = new Map(updatedIcons.map((icon) => [icon.id, icon]));
      
      const allWithIcons = updatedPreferences.map((pref) => ({
        ...pref,
        icon: pref.iconId ? updatedIconMap.get(pref.iconId) || null : null,
      }));
      
      return NextResponse.json(allWithIcons);
    }

    // Return all preferences with icons
    return NextResponse.json(preferencesWithIcons);
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    requireSuperAdmin(request);

    const body = await request.json();
    const { notificationType, enabled, sendEmail } = body;

    if (!notificationType || typeof enabled !== "boolean" || typeof sendEmail !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: notificationType, enabled, sendEmail" },
        { status: 400 }
      );
    }

    // Update or create preference
    const [existing] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.notificationType, notificationType))
      .limit(1);

    let updated;
    if (existing) {
      [updated] = await db
        .update(notificationPreferences)
        .set({
          enabled,
          sendEmail,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.notificationType, notificationType))
        .returning();
    } else {
      // Find description for this type
      const typeInfo = DEFAULT_NOTIFICATION_TYPES.find((nt) => nt.type === notificationType);
      [updated] = await db
        .insert(notificationPreferences)
        .values({
          notificationType,
          description: typeInfo?.description || notificationType,
          recipientType: typeInfo?.recipientType || "all",
          enabled,
          sendEmail,
        })
        .returning();
    }

    // Get icon information if iconId exists
    let icon = null;
    if (updated.iconId) {
      const [iconData] = await db
        .select()
        .from(icons)
        .where(eq(icons.id, updated.iconId))
        .limit(1);
      if (iconData) {
        icon = {
          id: iconData.id,
          name: iconData.name,
          iconName: iconData.iconName,
        };
      }
    }

    return NextResponse.json({ ...updated, icon });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error updating notification preference:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


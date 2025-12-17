import { db, auditLogs } from "@/lib/db";
import { AppUser } from "@/lib/types/user";

/**
 * Create an audit log entry for Admin/Super Admin actions
 * @param userId - ID of the user performing the action
 * @param action - Action being performed (e.g., "CREATE_USER", "UPDATE_ATTENDANCE")
 * @param entityType - Type of entity being acted upon (e.g., "user", "attendance")
 * @param entityId - ID of the entity (optional)
 * @param details - Additional details about the action (optional)
 */
export async function createAuditLog(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      entityType,
      entityId: entityId || null,
      details: details || null,
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    console.error("Error creating audit log:", error);
  }
}

/**
 * Helper function to create audit log from user object
 */
export async function auditLog(
  user: AppUser,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>
): Promise<void> {
  // Only log actions by Admin or Super Admin
  if (user.role === "admin" || user.role === "super_admin") {
    await createAuditLog(user.id, action, entityType, entityId, details);
  }
}




import { db, adminPermissions, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/middleware/auth";
import { AppUser } from "@/lib/auth-context";

// Define all admin modules
export const ADMIN_MODULES = [
  "dashboard",
  "menu",
  "mark_attendance",
  "view_attendance",
  "guests",
  "view_reports",
  "payments",
  "off_days",
  "feedback",
  "send_notifications",
  "settings",
] as const;

export type AdminModule = typeof ADMIN_MODULES[number];

// Module to route mapping
export const MODULE_ROUTES: Record<AdminModule, string> = {
  dashboard: "/admin/dashboard",
  menu: "/admin/menu",
  mark_attendance: "/admin/mark-attendance",
  view_attendance: "/admin/view-attendance",
  guests: "/admin/guests",
  view_reports: "/admin/view-reports",
  payments: "/admin/payments",
  off_days: "/admin/off-days",
  feedback: "/admin/feedback",
  send_notifications: "/admin/send-notifications",
  settings: "/admin/settings",
};

// Route to module mapping (reverse lookup)
export function getModuleFromRoute(route: string): AdminModule | null {
  for (const [module, moduleRoute] of Object.entries(MODULE_ROUTES)) {
    if (route.startsWith(moduleRoute)) {
      return module as AdminModule;
    }
  }
  return null;
}

// Get all permissions for an admin
export async function getAdminPermissions(adminId: string): Promise<Record<AdminModule, boolean>> {
  const permissions = await db
    .select()
    .from(adminPermissions)
    .where(eq(adminPermissions.adminId, adminId));

  // Initialize all modules to false
  const result: Record<AdminModule, boolean> = {} as Record<AdminModule, boolean>;
  ADMIN_MODULES.forEach((module) => {
    result[module] = false;
  });

  // Set permissions from database
  permissions.forEach((perm) => {
    if (ADMIN_MODULES.includes(perm.module as AdminModule)) {
      result[perm.module as AdminModule] = perm.allowed;
    }
  });

  return result;
}

// Check if admin has permission for a specific module
export async function hasPermission(adminId: string, module: AdminModule): Promise<boolean> {
  // First verify the user is actually an admin
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, adminId))
    .limit(1);

  if (user.length === 0 || (user[0].role !== "admin" && user[0].role !== "super_admin")) {
    return false;
  }

  // Superadmin always has access
  if (user[0].role === "super_admin") {
    return true;
  }

  // Check permission for regular admin
  const permission = await db
    .select()
    .from(adminPermissions)
    .where(
      and(
        eq(adminPermissions.adminId, adminId),
        eq(adminPermissions.module, module)
      )
    )
    .limit(1);

  if (permission.length === 0) {
    return false; // No permission record means not allowed
  }

  return permission[0].allowed;
}

// Get list of allowed module identifiers for an admin
export async function getAllowedModules(adminId: string): Promise<AdminModule[]> {
  const permissions = await getAdminPermissions(adminId);
  return ADMIN_MODULES.filter((module) => permissions[module]);
}

// Middleware helper for API routes - checks permission and throws if not allowed
export async function checkAdminPermission(
  request: NextRequest,
  module: AdminModule
): Promise<AppUser> {
  const user = requireAdmin(request);

  // Superadmin bypasses permission checks
  if (user.role === "super_admin") {
    return user;
  }

  // Check permission for regular admin
  const hasAccess = await hasPermission(user.id, module);
  if (!hasAccess) {
    throw new Error(`Forbidden: Admin does not have permission for module ${module}`);
  }

  return user;
}

// Update permissions for an admin (used by superadmin)
export async function updateAdminPermissions(
  adminId: string,
  permissions: Partial<Record<AdminModule, boolean>>
): Promise<void> {
  // Verify admin exists and is actually an admin
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, adminId))
    .limit(1);

  if (user.length === 0) {
    throw new Error("Admin user not found");
  }

  if (user[0].role !== "admin" && user[0].role !== "super_admin") {
    throw new Error("User is not an admin");
  }

  // Don't allow modifying superadmin permissions
  if (user[0].role === "super_admin") {
    throw new Error("Cannot modify superadmin permissions");
  }

  // Update or insert permissions
  for (const [module, allowed] of Object.entries(permissions)) {
    if (!ADMIN_MODULES.includes(module as AdminModule)) {
      continue; // Skip invalid modules
    }

    const existing = await db
      .select()
      .from(adminPermissions)
      .where(
        and(
          eq(adminPermissions.adminId, adminId),
          eq(adminPermissions.module, module)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing permission
      await db
        .update(adminPermissions)
        .set({
          allowed: allowed ?? false,
          updatedAt: new Date(),
        })
        .where(eq(adminPermissions.id, existing[0].id));
    } else {
      // Insert new permission
      await db.insert(adminPermissions).values({
        adminId,
        module: module as AdminModule,
        allowed: allowed ?? false,
      });
    }
  }
}


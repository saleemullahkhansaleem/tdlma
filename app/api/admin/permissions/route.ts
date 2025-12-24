import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/middleware/auth";
import { db, users, adminPermissions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import {
  getAdminPermissions,
  updateAdminPermissions,
  ADMIN_MODULES,
  AdminModule,
} from "@/lib/utils/permissions";

// GET: Get all permissions (superadmin only)
export async function GET(request: NextRequest) {
  try {
    const superAdmin = requireSuperAdmin(request);

    // Get all admin users
    const adminUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.role, "admin"));

    // Get permissions for each admin
    const permissionsData = await Promise.all(
      adminUsers.map(async (admin) => {
        const permissions = await getAdminPermissions(admin.id);
        return {
          adminId: admin.id,
          adminName: admin.name,
          adminEmail: admin.email,
          permissions,
        };
      })
    );

    return NextResponse.json({
      permissions: permissionsData,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Update permissions for an admin (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const superAdmin = requireSuperAdmin(request);
    const body = await request.json();

    const { adminId, permissions } = body;

    if (!adminId || !permissions) {
      return NextResponse.json(
        { error: "Missing required fields: adminId, permissions" },
        { status: 400 }
      );
    }

    // Validate permissions object
    const validPermissions: Partial<Record<AdminModule, boolean>> = {};
    for (const [module, allowed] of Object.entries(permissions)) {
      if (ADMIN_MODULES.includes(module as AdminModule)) {
        validPermissions[module as AdminModule] = Boolean(allowed);
      }
    }

    // Update permissions
    await updateAdminPermissions(adminId, validPermissions);

    return NextResponse.json({
      success: true,
      message: "Permissions updated successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error updating permissions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


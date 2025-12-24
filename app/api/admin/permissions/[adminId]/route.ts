import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, requireAuth } from "@/lib/middleware/auth";
import { getAdminPermissions } from "@/lib/utils/permissions";

// GET: Get permissions for specific admin
// Allows superadmin to get any admin's permissions, or admin to get their own permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const user = requireAuth(request);
    const { adminId } = await params;

    // Superadmin can get any admin's permissions
    // Regular admin can only get their own permissions
    if (user.role !== "super_admin" && user.id !== adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const permissions = await getAdminPermissions(adminId);

    return NextResponse.json({
      adminId,
      permissions,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching admin permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


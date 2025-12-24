import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { eq, and } from "drizzle-orm";

// GET: Get list of users (for dropdowns, filters, etc.)
// Allows admins to fetch users for guest management and other purposes
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const { searchParams } = new URL(request.url);
    
    // Optional filter for role (default: all active users)
    const roleFilter = searchParams.get("role");
    const statusFilter = searchParams.get("status") || "Active";

    // Build where conditions
    const conditions = [];
    if (statusFilter) {
      conditions.push(eq(users.status, statusFilter as any));
    }
    if (roleFilter) {
      conditions.push(eq(users.role, roleFilter as any));
    }

    // Execute query
    const allUsers = conditions.length > 0
      ? await db.select().from(users).where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : await db.select().from(users).where(eq(users.status, "Active"));

    // Remove password hashes from response
    const usersWithoutPasswords = allUsers.map(
      ({ passwordHash, ...user }) => user
    );

    return NextResponse.json(usersWithoutPasswords);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching users list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


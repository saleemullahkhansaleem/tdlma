import { NextRequest, NextResponse } from "next/server";
import { db, auditLogs, users } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query conditions
    const conditions = [];
    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(auditLogs.createdAt, end));
    }
    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }
    if (entityType) {
      conditions.push(eq(auditLogs.entityType, entityType));
    }
    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    try {
      // Build base query for audit logs with user information
      let baseQuery = db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          details: auditLogs.details,
          createdAt: auditLogs.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id));

      // Apply conditions if any
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions)) as any;
      }

      // Get audit logs with pagination
      const logs = await baseQuery
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      let countQuery = db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs);

      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as any;
      }

      const countResult = await countQuery;
      const totalCount = countResult[0]?.count || 0;

      return NextResponse.json({
        logs,
        total: totalCount,
        limit,
        offset,
      });
    } catch (dbError: any) {
      // Check if error is due to missing table
      if (dbError.message?.includes("does not exist") || dbError.message?.includes("relation") || dbError.code === "42P01") {
        console.warn("Audit logs table does not exist yet. Run migrations first.");
        return NextResponse.json({
          logs: [],
          total: 0,
          limit,
          offset,
          message: "Audit logs table not found. Please run database migrations.",
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}


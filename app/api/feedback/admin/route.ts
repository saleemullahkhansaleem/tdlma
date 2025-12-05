import { NextRequest, NextResponse } from "next/server";
import { db, feedback, users } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { eq, and, or, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build base query
    let query = db
      .select({
        id: feedback.id,
        userId: feedback.userId,
        category: feedback.category,
        type: feedback.type,
        title: feedback.title,
        description: feedback.description,
        status: feedback.status,
        response: feedback.response,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(feedback)
      .leftJoin(users, eq(feedback.userId, users.id))
      .orderBy(desc(feedback.createdAt));

    // Get all feedback first (for filtering)
    const allFeedback = await query;

    // Apply filters
    let filtered = allFeedback;
    if (category) {
      filtered = filtered.filter((f) => f.category === category);
    }
    if (type) {
      filtered = filtered.filter((f) => f.type === type);
    }
    if (status) {
      filtered = filtered.filter((f) => f.status === status);
    }

    // Apply pagination
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      feedback: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching admin feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

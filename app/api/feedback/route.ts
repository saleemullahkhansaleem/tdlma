import { NextRequest, NextResponse } from "next/server";
import { db, feedback } from "@/lib/db";
import { requireAuth } from "@/lib/middleware/auth";
import { CreateFeedbackDto } from "@/lib/types/feedback";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const body: CreateFeedbackDto = await request.json();

    // Validate required fields
    if (!body.category || !body.type || !body.title || !body.description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create feedback
    const [newFeedback] = await db
      .insert(feedback)
      .values({
        userId: user.id,
        category: body.category,
        type: body.type,
        title: body.title,
        description: body.description,
        status: "Pending",
      })
      .returning();

    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);

    // Build query with filters
    let query = db.select().from(feedback).where(eq(feedback.userId, user.id));

    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    // Apply filters
    const conditions = [eq(feedback.userId, user.id)];
    if (category) {
      conditions.push(eq(feedback.category, category as any));
    }
    if (type) {
      conditions.push(eq(feedback.type, type as any));
    }
    if (status) {
      conditions.push(eq(feedback.status, status as any));
    }

    const userFeedback = await db
      .select()
      .from(feedback)
      .where(eq(feedback.userId, user.id))
      .orderBy(desc(feedback.createdAt));

    // Apply client-side filtering for enum types
    let filtered = userFeedback;
    if (category) {
      filtered = filtered.filter((f) => f.category === category);
    }
    if (type) {
      filtered = filtered.filter((f) => f.type === type);
    }
    if (status) {
      filtered = filtered.filter((f) => f.status === status);
    }

    return NextResponse.json(filtered);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

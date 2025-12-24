import { NextRequest, NextResponse } from "next/server";
import { db, feedback, users } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/middleware/auth";
import { checkAdminPermission } from "@/lib/utils/permissions";
import { UpdateFeedbackDto } from "@/lib/types/feedback";
import { eq, and } from "drizzle-orm";
import { sendNotification } from "@/lib/utils/notifications";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id: feedbackId } = await params;

    // Fetch feedback with user info
    const [feedbackItem] = await db
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
      .where(eq(feedback.id, feedbackId))
      .limit(1);

    if (!feedbackItem) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    // Check if user can access this feedback (own feedback or admin)
    if (feedbackItem.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(feedbackItem);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminPermission(request, "feedback");
    const { id: feedbackId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(feedbackId)) {
      return NextResponse.json(
        { error: "Invalid feedback ID format" },
        { status: 400 }
      );
    }

    let body: UpdateFeedbackDto;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Check if feedback exists
    const [existingFeedback] = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, feedbackId))
      .limit(1);

    if (!existingFeedback) {
      console.error(`Feedback not found with ID: ${feedbackId}`);
      // Try to find any feedback to see if it's a query issue
      const allFeedback = await db.select().from(feedback).limit(5);
      console.error(
        `Sample feedback IDs in DB:`,
        allFeedback.map((f) => f.id)
      );
      return NextResponse.json(
        { error: `Feedback not found with ID: ${feedbackId}` },
        { status: 404 }
      );
    }

    // Update feedback
    const updateData: any = {
      updatedAt: new Date(),
    };
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.response !== undefined) {
      updateData.response = body.response || null; // Allow empty string to be set to null
    }

    if (Object.keys(updateData).length === 1) {
      // Only updatedAt, no actual changes
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const [updatedFeedback] = await db
      .update(feedback)
      .set(updateData)
      .where(eq(feedback.id, feedbackId))
      .returning();

    if (!updatedFeedback) {
      return NextResponse.json(
        { error: "Failed to update feedback" },
        { status: 500 }
      );
    }

    // Send notification to feedback owner
    const oldStatus = existingFeedback.status;
    const newStatus = updatedFeedback.status;
    const hasResponse = updatedFeedback.response && updatedFeedback.response.trim().length > 0;

    if (hasResponse && !existingFeedback.response) {
      await sendNotification(existingFeedback.userId, {
        type: "feedback_responded",
        title: "Feedback Responded",
        message: `Your feedback "${existingFeedback.title}" has been responded to by admin.`,
        sendEmail: true,
      });
    }

    if (newStatus !== oldStatus) {
      await sendNotification(existingFeedback.userId, {
        type: "feedback_status_changed",
        title: "Feedback Status Updated",
        message: `Your feedback "${existingFeedback.title}" status has been changed from ${oldStatus} to ${newStatus}.`,
        sendEmail: true,
      });
    }

    return NextResponse.json(updatedFeedback);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

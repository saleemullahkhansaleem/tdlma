import { NextRequest, NextResponse } from "next/server";
import { db, users, emailVerificationTokens } from "@/lib/db";
import { requireAuth } from "@/lib/middleware/auth";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);

    // Get user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already verified
    if (dbUser.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 200 }
      );
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Invalidate any existing tokens for this user
    await db
      .update(emailVerificationTokens)
      .set({ used: true })
      .where(eq(emailVerificationTokens.userId, user.id));

    // Create new verification token
    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      token,
      expiresAt,
      used: false,
    });

    // Send verification email
    try {
      await sendVerificationEmail(dbUser.email, token, dbUser.name);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // In development, log the token as fallback
      if (process.env.NODE_ENV === "development") {
        console.log("Verification token (dev only):", token);
        console.log(
          "Verification URL:",
          `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/verify-email?token=${token}`
        );
      }
    }

    return NextResponse.json({
      message: "Verification email sent successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error sending verification email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




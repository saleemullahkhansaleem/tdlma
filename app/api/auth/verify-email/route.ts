import { NextRequest, NextResponse } from "next/server";
import { db, users, emailVerificationTokens } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find valid verification token
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.token, body.token),
          eq(emailVerificationTokens.used, false),
          gt(emailVerificationTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Update user email as verified
    await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, verificationToken.userId));

    // Mark token as used
    await db
      .update(emailVerificationTokens)
      .set({ used: true })
      .where(eq(emailVerificationTokens.id, verificationToken.id));

    return NextResponse.json({
      message: "Email verified successfully",
    });
  } catch (error: any) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




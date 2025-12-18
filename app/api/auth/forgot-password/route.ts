import { NextRequest, NextResponse } from "next/server";
import { db, users, passwordResetTokens } from "@/lib/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email.trim().toLowerCase()))
      .limit(1);

    // Don't reveal if user exists or not (security best practice)
    // Always return success message
    if (user) {
      // Generate reset token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

      // Invalidate any existing tokens for this user
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.userId, user.id));

      // Create new reset token
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
        used: false,
      });

      // Send password reset email
      try {
        await sendPasswordResetEmail(user.email, token, user.name);
        console.log("Password reset email sent successfully to:", user.email);
      } catch (emailError: any) {
        console.error("Failed to send password reset email:", emailError);
        
        // Log detailed error information
        if (emailError.message) {
          console.error("Email error details:", emailError.message);
        }
        
        // In development, log the token as fallback and show detailed error
        if (process.env.NODE_ENV === "development") {
          console.error("=".repeat(60));
          console.error("EMAIL CONFIGURATION ERROR:");
          console.error(emailError.message || "Unknown email error");
          console.error("=".repeat(60));
          console.log("\nPassword reset token (dev only):", token);
          console.log(
            "Reset URL:",
            `${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/reset-password?token=${token}`
          );
          console.log("\nTo fix this error:");
          console.log("1. Check your .env.local file has SMTP_USER and SMTP_PASSWORD set");
          console.log("2. For Hostinger email:");
          console.log("   - SMTP_USER should be your full email address (e.g., food@tensaidevs.com)");
          console.log("   - SMTP_PASSWORD should be your email account password");
          console.log("   - SMTP_HOST should be smtp.hostinger.com (or smtp.titan.email for newer accounts)");
          console.log("   - SMTP_PORT should be 465 (with SMTP_SECURE=true) or 587 (with SMTP_SECURE=false)");
          console.log("3. Ensure the email account is active in your Hostinger control panel");
          console.log("4. Verify email account credentials in Hostinger hPanel");
          console.log("=".repeat(60));
        }
        
        // Still return success to prevent email enumeration
        // The token is saved, user can request again if email fails
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error: any) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

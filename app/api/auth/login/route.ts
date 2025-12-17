import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email.trim().toLowerCase()))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      body.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if user is inactive
    if (user.status === "Inactive") {
      return NextResponse.json(
        { 
          error: "INACTIVE_USER",
          message: "You are inactive by admin. Please contact admin for more details."
        },
        { status: 403 }
      );
    }

    // Check if email is verified (warn but don't block)
    // We'll return emailVerified status so frontend can handle it
    const emailVerified = user.emailVerified || false;

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    
    // Add emailVerified to response
    const responseUser = { ...userWithoutPassword, emailVerified };

    // Create response with user data
    const response = NextResponse.json(responseUser);

    // Set httpOnly cookie for server-side authentication
    // Cookie contains user role for middleware access
    const authData = JSON.stringify({
      id: userWithoutPassword.id,
      role: userWithoutPassword.role,
    });

    response.cookies.set("tdlma_auth_token", authData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Error during login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

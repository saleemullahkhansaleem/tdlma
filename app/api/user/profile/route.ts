import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { requireAuth } from "@/lib/middleware/auth";
import { UpdateUserDto } from "@/lib/types/user";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
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

    // Don't return password hash
    const { passwordHash, ...userWithoutPassword } = dbUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const body: UpdateUserDto = await request.json();

    // Get user from database
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check email uniqueness if email is being updated
    if (body.email && body.email !== existingUser.email) {
      const [emailExists] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);

      if (emailExists) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
    }

    // Build update data (users can only update their own profile fields)
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.email !== undefined) {
      updateData.email = body.email;
    }
    if (body.designation !== undefined) {
      updateData.designation = body.designation || null;
    }
    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl || null;
    }

    // Note: Users cannot change their own role, status, or userType through profile
    // Only admins can do that through user management

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Don't return password hash
    const { passwordHash, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

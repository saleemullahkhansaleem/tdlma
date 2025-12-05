import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/middleware/auth";
import { CreateUserDto } from "@/lib/types/user";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const superAdmin = requireSuperAdmin(request);
    const body: CreateUserDto = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.password || !body.role) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password, role" },
        { status: 400 }
      );
    }

    // Validate role
    if (
      body.role !== "user" &&
      body.role !== "admin" &&
      body.role !== "super_admin"
    ) {
      return NextResponse.json(
        { error: "Role must be 'user', 'admin', or 'super_admin'" },
        { status: 400 }
      );
    }

    // Check if user with email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        passwordHash: passwordHash,
        role: body.role,
        avatarUrl: body.avatarUrl || null,
      })
      .returning();

    // Don't return password hash
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const superAdmin = requireSuperAdmin(request);

    // Get all users (admin only)
    const allUsers = await db.select().from(users).orderBy(users.createdAt);

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
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

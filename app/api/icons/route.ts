import { NextRequest, NextResponse } from "next/server";
import { db, icons } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/middleware/auth";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = db.select().from(icons);

    if (category) {
      query = query.where(eq(icons.category, category)) as any;
    }

    const allIcons = await query.orderBy(icons.name);

    return NextResponse.json(allIcons);
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching icons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    requireSuperAdmin(request);

    const body = await request.json();
    const { name, iconName, category, description } = body;

    if (!name || !iconName) {
      return NextResponse.json(
        { error: "Missing required fields: name, iconName" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(icons)
      .values({
        name,
        iconName,
        category: category || null,
        description: description || null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error creating icon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


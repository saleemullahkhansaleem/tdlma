import { NextRequest, NextResponse } from "next/server";
import { db, menus } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/middleware/auth";
import { CreateMenuDto } from "@/lib/types/menu";
import { eq, and } from "drizzle-orm";
import { notifyAllUsers } from "@/lib/utils/notifications";

export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const body: CreateMenuDto = await request.json();

    // Validate required fields
    if (!body.dayOfWeek || !body.weekType || !body.menuItems) {
      return NextResponse.json(
        { error: "Missing required fields: dayOfWeek, weekType, menuItems" },
        { status: 400 }
      );
    }

    // Check if menu already exists for this day and week type
    const [existingMenu] = await db
      .select()
      .from(menus)
      .where(
        and(
          eq(menus.dayOfWeek, body.dayOfWeek),
          eq(menus.weekType, body.weekType)
        )
      )
      .limit(1);

    if (existingMenu) {
      // Update existing menu
      const [updatedMenu] = await db
        .update(menus)
        .set({
          menuItems: body.menuItems,
          updatedAt: new Date(),
        })
        .where(eq(menus.id, existingMenu.id))
        .returning();

      // Notify all users
      await notifyAllUsers({
        type: "menu_updated",
        title: "Menu Updated",
        message: `Menu for ${body.dayOfWeek} (${body.weekType} week) has been updated.`,
        sendEmail: true,
      });

      return NextResponse.json(updatedMenu);
    }

    // Create new menu
    const [newMenu] = await db
      .insert(menus)
      .values({
        dayOfWeek: body.dayOfWeek,
        weekType: body.weekType,
        menuItems: body.menuItems,
      })
      .returning();

    // Notify all users
    await notifyAllUsers({
      type: "menu_created",
      title: "New Menu Added",
      message: `New menu for ${body.dayOfWeek} (${body.weekType} week) has been added.`,
      sendEmail: true,
    });

    return NextResponse.json(newMenu, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error creating menu:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Allow authenticated users (not just admins) to read menus
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);

    const weekType = searchParams.get("weekType");
    const dayOfWeek = searchParams.get("dayOfWeek");

    // Build query with filters
    let allMenus;
    if (weekType && dayOfWeek) {
      allMenus = await db
        .select()
        .from(menus)
        .where(
          and(
            eq(menus.weekType, weekType as any),
            eq(menus.dayOfWeek, dayOfWeek as any)
          )
        );
    } else if (weekType) {
      allMenus = await db
        .select()
        .from(menus)
        .where(eq(menus.weekType, weekType as any));
    } else if (dayOfWeek) {
      allMenus = await db
        .select()
        .from(menus)
        .where(eq(menus.dayOfWeek, dayOfWeek as any));
    } else {
      allMenus = await db.select().from(menus);
    }

    return NextResponse.json(allMenus);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching menus:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

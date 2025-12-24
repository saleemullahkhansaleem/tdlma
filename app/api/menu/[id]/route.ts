import { NextRequest, NextResponse } from "next/server";
import { db, menus } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { checkAdminPermission } from "@/lib/utils/permissions";
import { UpdateMenuDto } from "@/lib/types/menu";
import { eq } from "drizzle-orm";
import { notifyAllUsers } from "@/lib/utils/notifications";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminPermission(request, "menu");
    const { id: menuId } = await params;

    const [menu] = await db
      .select()
      .from(menus)
      .where(eq(menus.id, menuId))
      .limit(1);

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    return NextResponse.json(menu);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching menu:", error);
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
    const admin = await checkAdminPermission(request, "menu");
    const { id: menuId } = await params;

    let body: UpdateMenuDto;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Check if menu exists
    const [existingMenu] = await db
      .select()
      .from(menus)
      .where(eq(menus.id, menuId))
      .limit(1);

    if (!existingMenu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Update menu
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.menuItems !== undefined) {
      updateData.menuItems = body.menuItems;
    }

    const [updatedMenu] = await db
      .update(menus)
      .set(updateData)
      .where(eq(menus.id, menuId))
      .returning();

    if (!updatedMenu) {
      return NextResponse.json(
        { error: "Failed to update menu" },
        { status: 500 }
      );
    }

    // Notify all users
    await notifyAllUsers({
      type: "menu_updated",
      title: "Menu Updated",
      message: `Menu for ${existingMenu.dayOfWeek} (${existingMenu.weekType} week) has been updated.`,
      sendEmail: true,
    });

    return NextResponse.json(updatedMenu);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error updating menu:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminPermission(request, "menu");
    const { id: menuId } = await params;

    // Check if menu exists
    const [existingMenu] = await db
      .select()
      .from(menus)
      .where(eq(menus.id, menuId))
      .limit(1);

    if (!existingMenu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Delete menu
    await db.delete(menus).where(eq(menus.id, menuId));

    return NextResponse.json({ message: "Menu deleted successfully" });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error deleting menu:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

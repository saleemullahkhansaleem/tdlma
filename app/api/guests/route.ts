import { NextRequest, NextResponse } from "next/server";
import { db, guests, notifications } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/middleware/auth";
import { CreateGuestDto } from "@/lib/types/guest";
import { eq, and, gte, lte } from "drizzle-orm";
import { auditLog } from "@/lib/middleware/audit";
import { getSetting } from "@/lib/utils/settings-history";

export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const body: CreateGuestDto | CreateGuestDto[] = await request.json();

    // Handle both single guest and array of guests
    const guestsToCreate = Array.isArray(body) ? body : [body];

    // Validate all guests
    for (const guest of guestsToCreate) {
      if (!guest.inviterId || !guest.name || !guest.date || !guest.mealType) {
        return NextResponse.json(
          { error: "Missing required fields: inviterId, name, date, mealType" },
          { status: 400 }
        );
      }
    }

    // Group guests by date to optimize settings lookups
    const guestsByDate = new Map<string, typeof guestsToCreate>();
    for (const guest of guestsToCreate) {
      const dateKey = guest.date;
      if (!guestsByDate.has(dateKey)) {
        guestsByDate.set(dateKey, []);
      }
      guestsByDate.get(dateKey)!.push(guest);
    }

    // Get guest meal amounts for each unique date
    const dateAmountMap = new Map<string, string>();
    for (const date of guestsByDate.keys()) {
      const guestDate = new Date(date);
      const guestMealAmountStr = await getSetting("guest_meal_amount", guestDate);
      dateAmountMap.set(date, guestMealAmountStr || "0");
    }

    // Prepare all guest values with correct amounts
    const guestValues = guestsToCreate.map((guest) => ({
      inviterId: guest.inviterId,
      name: guest.name,
      date: guest.date,
      mealType: guest.mealType as any,
      amount: dateAmountMap.get(guest.date) || "0",
    }));

    // Create all guests with amount in a single batch insert
    const createdGuests = await db
      .insert(guests)
      .values(guestValues)
      .returning();

    // Create notification for each inviter when guest is added
    const inviterIds = new Set(guestsToCreate.map((g) => g.inviterId));
    for (const inviterId of inviterIds) {
      const guestsForInviter = createdGuests.filter((g) => g.inviterId === inviterId);
      const guestNames = guestsForInviter.map((g) => g.name).join(", ");
      const totalAmount = guestsForInviter.reduce(
        (sum, g) => sum + parseFloat(g.amount || "0"),
        0
      );

      await db.insert(notifications).values({
        userId: inviterId,
        type: "guest_added",
        title: "Guest Added",
        message: `Guest${guestsForInviter.length > 1 ? "s" : ""} ${guestNames} ${guestsForInviter.length > 1 ? "have" : "has"} been added for ${guestsForInviter[0].date}. Total expense: ${totalAmount.toFixed(2)}`,
        read: false,
      });
    }

    // Create audit log
    await auditLog(admin, "CREATE_GUEST", "guest", createdGuests[0]?.id, {
      count: createdGuests.length,
      inviterIds: Array.from(inviterIds),
    });

    return NextResponse.json(
      Array.isArray(body) ? createdGuests : createdGuests[0],
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error creating guest:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date");
    const mealType = searchParams.get("mealType");
    const inviterId = searchParams.get("inviterId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // If user is not admin, they can only fetch their own guests
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    const effectiveInviterId = isAdmin ? inviterId : user.id;

    let query = db.select().from(guests);

    const conditions = [];
    
    // Always filter by inviterId (either the requested one for admins, or the user's own ID for regular users)
    if (effectiveInviterId) {
      conditions.push(eq(guests.inviterId, effectiveInviterId));
    } else if (!isAdmin) {
      // Regular users must always filter by their own ID
      conditions.push(eq(guests.inviterId, user.id));
    }
    
    if (date) {
      conditions.push(eq(guests.date, date));
    }
    if (mealType) {
      conditions.push(eq(guests.mealType, mealType as any));
    }
    if (startDate) {
      conditions.push(gte(guests.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(guests.date, endDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const allGuests = await query;

    return NextResponse.json(allGuests);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error fetching guests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

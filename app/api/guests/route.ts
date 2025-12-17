import { NextRequest, NextResponse } from "next/server";
import { db, guests, settings, notifications } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { CreateGuestDto } from "@/lib/types/guest";
import { eq, and } from "drizzle-orm";
import { auditLog } from "@/lib/middleware/audit";

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

    // Get guest meal amount from settings
    const [settingsData] = await db.select().from(settings).limit(1);
    const guestMealAmount = settingsData?.guestMealAmount || "0";

    // Create all guests with amount
    const createdGuests = await db
      .insert(guests)
      .values(
        guestsToCreate.map((guest) => ({
          inviterId: guest.inviterId,
          name: guest.name,
          date: guest.date,
          mealType: guest.mealType as any,
          amount: guestMealAmount,
        }))
      )
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
    const admin = requireAdmin(request);
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date");
    const mealType = searchParams.get("mealType");
    const inviterId = searchParams.get("inviterId");

    let query = db.select().from(guests);

    const conditions = [];
    if (date) {
      conditions.push(eq(guests.date, date));
    }
    if (mealType) {
      conditions.push(eq(guests.mealType, mealType as any));
    }
    if (inviterId) {
      conditions.push(eq(guests.inviterId, inviterId));
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

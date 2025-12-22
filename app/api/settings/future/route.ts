import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { getFutureSettings } from "@/lib/utils/settings-history";

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    const futureSettings = await getFutureSettings();

    return NextResponse.json(futureSettings);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching future settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


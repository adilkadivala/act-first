import { NextRequest, NextResponse } from "next/server";
import { recordDismissal } from "@/lib/rides/memory";
import type { RideDismissalPayload } from "@/lib/rides/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { pickup, destination, suggestedLeaveAt, reason } = (await request.json()) as RideDismissalPayload;

  await recordDismissal({
    pickup,
    destination,
    suggestedLeaveAt,
    reason
  });

  return NextResponse.json({
    status: "dismissed",
    dismissedAt: new Date().toISOString(),
    pickup,
    destination
  });
}

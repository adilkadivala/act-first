import { NextRequest, NextResponse } from "next/server";
import { recordConfirmation, recordEdits } from "@/lib/rides/memory";
import type { RideConfirmationPayload } from "@/lib/rides/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const {
    platform,
    rideType,
    pickup,
    destination,
    suggestedLeaveAt,
    previousPickup,
    previousDestination,
    previousSuggestedLeaveAt
  } = (await request.json()) as RideConfirmationPayload & {
    previousPickup: string;
    previousDestination: string;
    previousSuggestedLeaveAt: string;
  };

  await recordEdits({
    pickup,
    destination,
    suggestedLeaveAt,
    previousPickup,
    previousDestination,
    previousSuggestedLeaveAt
  });
  await recordConfirmation({
    platform,
    rideType,
    pickup,
    destination,
    suggestedLeaveAt
  });

  return NextResponse.json({
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
    platform,
    rideType,
    pickup,
    destination,
    suggestedLeaveAt
  });
}

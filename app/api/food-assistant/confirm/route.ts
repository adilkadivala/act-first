import { NextRequest, NextResponse } from "next/server";
import { confirmFoodSuggestion } from "@/lib/food/proactive";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    suggestionId: string;
    restaurant: string;
    items: string[];
    scheduledFor: string;
  };
  return NextResponse.json(await confirmFoodSuggestion(payload));
}

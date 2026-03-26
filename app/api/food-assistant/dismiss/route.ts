import { NextRequest, NextResponse } from "next/server";
import { dismissFoodSuggestion } from "@/lib/food/proactive";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { suggestionId, reason } = (await request.json()) as { suggestionId: string; reason: string };
  return NextResponse.json(await dismissFoodSuggestion(suggestionId, reason));
}

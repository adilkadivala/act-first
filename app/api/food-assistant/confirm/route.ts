import { NextRequest, NextResponse } from "next/server";
import { confirmFoodSuggestion } from "@/lib/food/proactive";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { suggestionId } = (await request.json()) as { suggestionId: string };
  return NextResponse.json(await confirmFoodSuggestion(suggestionId));
}

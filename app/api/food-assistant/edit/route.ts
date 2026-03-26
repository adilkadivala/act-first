import { NextRequest, NextResponse } from "next/server";
import { editFoodSuggestion } from "@/lib/food/proactive";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    suggestionId: string;
    field: "restaurant" | "items" | "scheduledFor";
    from: string;
    to: string;
  };
  return NextResponse.json(await editFoodSuggestion(payload));
}

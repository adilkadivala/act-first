import { NextResponse } from "next/server";
import { getFoodAssistantState } from "@/lib/food/proactive";

export const runtime = "nodejs";

export async function GET() {
  const data = await getFoodAssistantState();
  return NextResponse.json(data);
}

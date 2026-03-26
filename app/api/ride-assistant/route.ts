import { NextResponse } from "next/server";
import { getRideAssistantState } from "@/lib/rides/proactive";

export const runtime = "nodejs";

export async function GET() {
  const data = await getRideAssistantState();
  return NextResponse.json(data);
}

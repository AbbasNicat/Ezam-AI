import { NextResponse } from "next/server";
import { parseTravelRequest } from "@/lib/ai/provider";
import type { TravelRequest } from "@/types/travel";

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: string; context?: Partial<TravelRequest> };
  const text = body.text?.trim() ?? "";
  if (!text) {
    return NextResponse.json({ error: "Add a travel note to interpret." }, { status: 400 });
  }
  const interpretation = await parseTravelRequest(text, body.context ?? {});
  return NextResponse.json(interpretation);
}

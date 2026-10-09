import { NextResponse } from "next/server";
import { checkAgentRateLimit } from "@/lib/agent/rate-limit";
import { regenerateAlternatives } from "@/lib/agent/regeneration";
import { regenerateRequestSchema } from "@/lib/agent/schemas";

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 16_000) return NextResponse.json({ error: "REQUEST_TOO_LARGE" }, { status: 413 });
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rate = checkAgentRateLimit(client);
  if (!rate.allowed) return NextResponse.json({ error: "RATE_LIMITED", retryAfterSeconds: rate.retryAfterSeconds }, { status: 429 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }
  const parsed = regenerateRequestSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", details: parsed.error.flatten() }, { status: 400 });
  const destination = typeof parsed.data.currentRequest.destination === "string" ? parsed.data.currentRequest.destination : undefined;
  return NextResponse.json(await regenerateAlternatives({ instruction: parsed.data.instruction, preferredLanguage: parsed.data.preferredLanguage, destination, flightId: parsed.data.selectedPackage.flightId, hotelId: parsed.data.selectedPackage.hotelId, excludedOptionIds: parsed.data.excludedOptionIds }));
}

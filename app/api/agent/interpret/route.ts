import { NextResponse } from "next/server";
import { interpretAgentRequest } from "@/lib/agent/openai";
import { planningStages } from "@/lib/agent/progress";
import { checkAgentRateLimit } from "@/lib/agent/rate-limit";
import { interpretRequestSchema } from "@/lib/agent/schemas";

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 16_000) return NextResponse.json({ error: "REQUEST_TOO_LARGE" }, { status: 413 });
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rate = checkAgentRateLimit(client);
  if (!rate.allowed) return NextResponse.json({ error: "RATE_LIMITED", retryAfterSeconds: rate.retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }
  const parsed = interpretRequestSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", details: parsed.error.flatten() }, { status: 400 });
  const result = await interpretAgentRequest(parsed.data);
  return NextResponse.json({ ...result, progress: planningStages(result.intent.responseLanguage, Boolean(parsed.data.companyPolicy)) });
}

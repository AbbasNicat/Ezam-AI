import { NextResponse } from "next/server";
import { requestFormSchema, requestFromForm } from "@/lib/data/request-form";
import { planTrip } from "@/lib/planning/planner";
import type { RequestFormValues } from "@/lib/data/demo-scenario";

export async function POST(request: Request) {
  const body = (await request.json()) as { values?: RequestFormValues };
  const parsed = requestFormSchema.safeParse(body.values);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid travel request." }, { status: 400 });
  }
  const plan = planTrip({ request: requestFromForm(parsed.data) });
  return NextResponse.json(plan);
}

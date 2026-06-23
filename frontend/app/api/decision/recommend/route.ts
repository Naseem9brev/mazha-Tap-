import { NextResponse } from "next/server";
import type { DecisionRequest } from "@/lib/api";
import { evaluateDecision } from "@/lib/rain/decision";

export async function POST(request: Request) {
  let body: DecisionRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.plantation || !Array.isArray(body.hourly_forecast)) {
    return NextResponse.json({ detail: "plantation and hourly_forecast are required" }, { status: 400 });
  }

  try {
    return NextResponse.json(evaluateDecision(body.plantation, body.hourly_forecast));
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Decision engine error";
    return NextResponse.json({ detail }, { status: 500 });
  }
}

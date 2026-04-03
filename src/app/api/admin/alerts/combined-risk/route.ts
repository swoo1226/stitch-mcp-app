import { runCombinedRiskAlert } from "../../../../../lib/combined-risk-alert";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const shouldSend = request.nextUrl.searchParams.get("send") === "1";
    const result = await runCombinedRiskAlert({ shouldSend });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown combined risk alert error" },
      { status: 500 },
    );
  }
}

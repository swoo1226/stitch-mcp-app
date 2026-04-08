import { runCombinedRiskAlert } from "../../../../../lib/combined-risk-alert";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../../lib/api-auth";

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, "super_admin", "team_admin");
  if (auth instanceof NextResponse) return auth;

  try {
    const shouldSend = request.nextUrl.searchParams.get("send") === "1";
    const managedTeamId = auth.role === "team_admin" ? auth.managedTeamId : null;
    const result = await runCombinedRiskAlert({ shouldSend, managedTeamId });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown combined risk alert error" },
      { status: 500 },
    );
  }
}

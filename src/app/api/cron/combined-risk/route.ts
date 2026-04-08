import type { NextRequest } from "next/server";
import { getKoreanBusinessDaySkipReason } from "../../../../lib/korean-holidays";
import { runCombinedRiskAlert } from "../../../../lib/combined-risk-alert";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return unauthorized();
      }
    }

    const skipReason = getKoreanBusinessDaySkipReason();
    if (skipReason) {
      return Response.json({ sent: false, skipped: true, reason: skipReason });
    }

    const result = await runCombinedRiskAlert({ shouldSend: true, managedTeamId: null });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown cron error" },
      { status: 500 },
    );
  }
}

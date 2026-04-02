import type { NextRequest } from "next/server";
import { getKoreanBusinessDaySkipReason } from "../../../../lib/korean-holidays";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const skipReason = getKoreanBusinessDaySkipReason();
  if (skipReason) {
    return Response.json({ sent: false, skipped: true, reason: skipReason });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return unauthorized();
    }
  }

  const baseUrl = request.nextUrl.origin;
  const response = await fetch(`${baseUrl}/api/admin/alerts/combined-risk`, {
    method: "POST",
    headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : undefined,
    cache: "no-store",
  });

  const payload = await response.json();
  return Response.json(payload, { status: response.status });
}

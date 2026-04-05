import { NextRequest, NextResponse } from "next/server";
import { searchJiraUsers } from "../../../../../lib/jira";
import { requireRole } from "../../../../../lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "super_admin", "team_admin");
  if (auth instanceof NextResponse) return auth;

  const query = req.nextUrl.searchParams.get("q") ?? "";
  if (!query.trim()) return NextResponse.json({ users: [] });
  try {
    const users = await searchJiraUsers(query);
    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

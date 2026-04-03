import { NextRequest, NextResponse } from "next/server";
import { searchJiraUsers } from "../../../../../lib/jira";

export async function GET(req: NextRequest) {
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

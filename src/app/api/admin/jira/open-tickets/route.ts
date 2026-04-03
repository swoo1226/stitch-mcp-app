import type { NextRequest } from "next/server";
import { fetchOpenIssuesForAssignees } from "../../../../../lib/jira";
import { createSupabaseAdminClient } from "../../../../../lib/supabase-admin";

const SNAPSHOT_TTL_MS = 10 * 60 * 1000;
const PREVIEW_LIMIT = 3;

type SnapshotTicket = {
  key: string;
  summary: string;
  status: string;
  priority: string | null;
  updated: string | null;
  browseUrl: string;
};

type SnapshotRow = {
  user_id: string;
  team_id: string | null;
  open_ticket_count: number;
  tickets: SnapshotTicket[];
  synced_at: string;
  expires_at: string;
};

type RouteMember = {
  userId: string;
  name: string;
  teamId: string | null;
  jiraAccountId: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
    const payload = (await request.json()) as { members?: RouteMember[]; projectKeys?: string[] | null };
    const projectKeys = payload.projectKeys?.length ? payload.projectKeys : null;
    const eligibleUsers = (payload.members ?? []).filter((user) => user.jiraAccountId);
    if (eligibleUsers.length === 0) {
      return Response.json({ snapshots: [], source: "empty" });
    }

    const userIds = eligibleUsers.map((user) => user.userId);
    const now = Date.now();
    const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const supabase = hasServiceRole ? createSupabaseAdminClient() : null;
    let cachedSnapshots: SnapshotRow[] = [];

    if (supabase) {
      const { data: cachedRows, error: cachedError } = await supabase
        .from("jira_member_ticket_snapshots")
        .select("user_id, team_id, open_ticket_count, tickets, synced_at, expires_at")
        .in("user_id", userIds);

      if (!cachedError) {
        cachedSnapshots = (cachedRows ?? []) as SnapshotRow[];
      }
    }

    const cachedByUser = new Map(cachedSnapshots.map((row) => [row.user_id, row]));
    const allFresh =
      !forceRefresh &&
      eligibleUsers.every((user) => {
        const row = cachedByUser.get(user.userId);
        return row && new Date(row.expires_at).getTime() > now;
      });

    if (allFresh) {
      return Response.json({
        snapshots: eligibleUsers.map((user) => ({
          userId: user.userId,
          name: user.name,
          teamId: user.teamId,
          openTicketCount: cachedByUser.get(user.userId)?.open_ticket_count ?? 0,
          tickets: cachedByUser.get(user.userId)?.tickets ?? [],
          syncedAt: cachedByUser.get(user.userId)?.synced_at ?? null,
        })),
        source: "snapshot",
      });
    }

    const issues = await fetchOpenIssuesForAssignees(
      eligibleUsers.map((user) => user.jiraAccountId as string),
      projectKeys,
    );

    const issuesByAssignee = new Map<string, typeof issues>();
    for (const issue of issues) {
      const accountId = issue.assigneeAccountId;
      if (!accountId) continue;
      const existing = issuesByAssignee.get(accountId) ?? [];
      existing.push(issue);
      issuesByAssignee.set(accountId, existing);
    }

    const syncedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + SNAPSHOT_TTL_MS).toISOString();
    const snapshots = eligibleUsers.map((user) => {
      const memberIssues = issuesByAssignee.get(user.jiraAccountId as string) ?? [];
      const preview = memberIssues.slice(0, PREVIEW_LIMIT).map((issue) => ({
        key: issue.key,
        summary: issue.summary,
        status: issue.status,
        priority: issue.priority,
        updated: issue.updated,
        browseUrl: issue.browseUrl,
      }));

      return {
        userId: user.userId,
        name: user.name,
        teamId: user.teamId,
        openTicketCount: memberIssues.length,
        tickets: preview,
        syncedAt,
      };
    });

    if (supabase) {
      const rows: SnapshotRow[] = snapshots.map((snapshot) => ({
        user_id: snapshot.userId,
        team_id: snapshot.teamId,
        open_ticket_count: snapshot.openTicketCount,
        tickets: snapshot.tickets,
        synced_at: syncedAt,
        expires_at: expiresAt,
      }));

      const { error: upsertError } = await supabase
        .from("jira_member_ticket_snapshots")
        .upsert(rows, { onConflict: "user_id" });

      if (upsertError && !String(upsertError.message).includes("jira_member_ticket_snapshots")) {
        throw new Error(upsertError.message);
      }
    }

    return Response.json({
      snapshots,
      source: supabase ? "live+snapshot" : "live",
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown Jira snapshot error" },
      { status: 500 },
    );
  }
}

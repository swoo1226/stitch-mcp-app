import { createSupabaseAdminClient } from "../../../../../lib/supabase-admin";
import { fetchOpenIssuesForAssignees } from "../../../../../lib/jira";
import { sendTeamsAdaptiveCard } from "../../../../../lib/teams";
import type { NextRequest } from "next/server";

type UserRow = {
  id: string;
  name: string;
  team_id: string | null;
  part_id: string | null;
  jira_account_id: string | null;
};

type TeamRow = {
  id: string;
  name: string;
};

type PartRow = {
  id: string;
  name: string;
};

type MoodLogRow = {
  user_id: string;
  score: number;
  logged_at: string;
};

type RiskLevel = "critical" | "warning";

type CombinedRiskTarget = {
  userId: string;
  name: string;
  teamName: string;
  partName: string | null;
  todayScore: number;
  recentDelta: number | null;
  openTicketCount: number;
  blockerCount: number;
  tickets: Array<{
    key: string;
    summary: string;
    status: string;
    browseUrl: string;
  }>;
  level: RiskLevel;
};

const LOW_SCORE_THRESHOLD = 50;
const HIGH_OPEN_TICKET_THRESHOLD = 5;
const RECENT_DAYS = 3;
const BLOCKER_STATUS_KEYWORDS = ["blocked", "block", "차단", "대기"];

function isoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function kstDayStart(iso: string) {
  return `${iso}T00:00:00+09:00`;
}

function kstDayEnd(iso: string) {
  return `${iso}T23:59:59+09:00`;
}

function utcToKstDate(utcStr: string) {
  const d = new Date(utcStr);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function isBlockerStatus(status: string) {
  const normalized = status.toLowerCase();
  return BLOCKER_STATUS_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function buildTeamsCard(targets: CombinedRiskTarget[]) {
  const criticalCount = targets.filter((target) => target.level === "critical").length;

  return {
    body: [
      {
        type: "TextBlock",
        text: `주의 필요 팀원 ${targets.length}명`,
        weight: "Bolder",
        size: "Medium",
      },
      {
        type: "TextBlock",
        text: `오후 2시 기준 컨디션과 Jira 미완료 티켓을 함께 평가했습니다. Critical ${criticalCount}명.`,
        wrap: true,
        spacing: "Small",
      },
      ...targets.flatMap((target) => [
        {
          type: "Container",
          style: target.level === "critical" ? "attention" : "warning",
          spacing: "Medium",
          items: [
            {
              type: "ColumnSet",
              columns: [
                {
                  type: "Column",
                  width: "stretch",
                  items: [
                    {
                      type: "TextBlock",
                      text: target.level === "critical" ? "CRITICAL" : "WARNING",
                      weight: "Bolder",
                      color: target.level === "critical" ? "attention" : "warning",
                      spacing: "None",
                    },
                    {
                      type: "TextBlock",
                      text: `${target.name} · ${target.teamName}${target.partName ? ` · ${target.partName}` : ""}`,
                      weight: "Bolder",
                      wrap: true,
                      spacing: "Small",
                    },
                  ],
                },
              ],
            },
            {
              type: "FactSet",
              spacing: "Small",
              facts: [
                { title: "오늘 점수", value: `${target.todayScore}pt` },
                {
                  title: `최근 ${RECENT_DAYS}일 변화`,
                  value: target.recentDelta == null ? "데이터 없음" : `${target.recentDelta > 0 ? "+" : ""}${target.recentDelta}pt`,
                },
                { title: "미완료", value: `${target.openTicketCount}건` },
                { title: "Blocker", value: `${target.blockerCount}건` },
              ],
            },
            ...target.tickets.map((ticket) => ({
              type: "TextBlock",
              text: `• ${ticket.key} · ${ticket.summary}`,
              wrap: true,
              spacing: "Small",
              isSubtle: true,
            })),
          ],
        },
      ]),
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "어드민 열기",
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin`,
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const shouldSend = request.nextUrl.searchParams.get("send") === "1";
    const supabase = createSupabaseAdminClient();
    const today = new Date();
    const todayIso = isoDate(today);
    const rangeStartDate = new Date(today);
    rangeStartDate.setDate(rangeStartDate.getDate() - RECENT_DAYS);
    const rangeStartIso = isoDate(rangeStartDate);

    const [{ data: users, error: usersError }, { data: teams, error: teamsError }, { data: parts, error: partsError }] = await Promise.all([
      supabase
        .from("users")
        .select("id, name, team_id, part_id, jira_account_id")
        .not("jira_account_id", "is", null)
        .order("name", { ascending: true }),
      supabase.from("teams").select("id, name"),
      supabase.from("parts").select("id, name"),
    ]);

    if (usersError) throw new Error(usersError.message);
    if (teamsError) throw new Error(teamsError.message);
    if (partsError) throw new Error(partsError.message);

    const eligibleUsers = (users ?? []) as UserRow[];
    if (eligibleUsers.length === 0) {
      return Response.json({ sent: false, reason: "no_eligible_users" });
    }

    const { data: logs, error: logsError } = await supabase
      .from("mood_logs")
      .select("user_id, score, logged_at")
      .in("user_id", eligibleUsers.map((user) => user.id))
      .gte("logged_at", kstDayStart(rangeStartIso))
      .lte("logged_at", kstDayEnd(todayIso))
      .order("logged_at", { ascending: true });

    if (logsError) throw new Error(logsError.message);

    const issues = await fetchOpenIssuesForAssignees(
      eligibleUsers.map((user) => user.jira_account_id as string),
    );
    const issuesByAssignee = new Map<string, typeof issues>();
    for (const issue of issues) {
      const accountId = issue.assigneeAccountId;
      if (!accountId) continue;
      const existing = issuesByAssignee.get(accountId) ?? [];
      existing.push(issue);
      issuesByAssignee.set(accountId, existing);
    }
    const teamNameById = new Map(((teams ?? []) as TeamRow[]).map((team) => [team.id, team.name]));
    const partNameById = new Map(((parts ?? []) as PartRow[]).map((part) => [part.id, part.name]));
    const logsByUser = new Map<string, MoodLogRow[]>();

    for (const log of ((logs ?? []) as MoodLogRow[])) {
      const existing = logsByUser.get(log.user_id) ?? [];
      existing.push(log);
      logsByUser.set(log.user_id, existing);
    }

    const targets: CombinedRiskTarget[] = eligibleUsers.flatMap((user) => {
      const userLogs = logsByUser.get(user.id) ?? [];
      const latestByDay = new Map<string, number>();
      for (const log of userLogs) {
        latestByDay.set(utcToKstDate(log.logged_at), log.score);
      }

      const todayScore = latestByDay.get(todayIso) ?? null;
      if (todayScore === null || todayScore > LOW_SCORE_THRESHOLD) {
        return [];
      }

      const priorScores: number[] = [];
      for (let offset = 1; offset <= RECENT_DAYS; offset += 1) {
        const day = new Date(today);
        day.setDate(day.getDate() - offset);
        const score = latestByDay.get(isoDate(day));
        if (score != null) priorScores.push(score);
      }
      const priorAverage = average(priorScores);
      const recentDelta = priorAverage == null ? null : todayScore - priorAverage;

      const tickets = (issuesByAssignee.get(user.jira_account_id as string) ?? []).map((issue) => ({
        key: issue.key,
        summary: issue.summary,
        status: issue.status,
        browseUrl: issue.browseUrl,
      }));
      const openTicketCount = tickets.length;
      const blockerCount = tickets.filter((ticket) => isBlockerStatus(ticket.status)).length;
      const qualifies =
        openTicketCount >= HIGH_OPEN_TICKET_THRESHOLD ||
        blockerCount >= 1;

      if (!qualifies) {
        return [];
      }

      const level: RiskLevel = todayScore <= 40 || blockerCount > 0 ? "critical" : "warning";

      return [{
        userId: user.id,
        name: user.name,
        teamName: teamNameById.get(user.team_id ?? "") ?? "미지정 팀",
        partName: partNameById.get(user.part_id ?? "") ?? null,
        todayScore,
        recentDelta,
        openTicketCount,
        blockerCount,
        tickets: tickets.slice(0, 2),
        level,
      }];
    });

    if (targets.length === 0) {
      return Response.json({ sent: false, reason: "no_targets" });
    }

    const criticalCount = targets.filter((target) => target.level === "critical").length;
    let webhookResponse: string | null = null;
    if (shouldSend) {
      webhookResponse = await sendTeamsAdaptiveCard(buildTeamsCard(targets));
    }

    return Response.json({
      sent: shouldSend,
      response: webhookResponse,
      targetCount: targets.length,
      criticalCount,
      targets,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown combined risk alert error" },
      { status: 500 },
    );
  }
}

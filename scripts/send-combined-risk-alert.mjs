import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import https from "node:https";
import { createClient } from "@supabase/supabase-js";

loadEnvFile(".env.local");

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "ATLASSIAN_EMAIL",
  "ATLASSIAN_API_TOKEN",
  "JIRA_BASE_URL",
  "TEAMS_WEBHOOK_URL",
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing required env: ${key}`);
  }
}

const BLOCKER_STATUS_KEYWORDS = ["blocked", "block", "차단", "대기"];
const LOW_SCORE_THRESHOLD = 50;
const HIGH_OPEN_TICKET_THRESHOLD = 5;
const RECENT_DAYS = 3;
const useInsecureTls =
  process.env.JIRA_INSECURE_TLS === "1" ||
  process.env.TEAMS_INSECURE_TLS === "1" ||
  process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  const today = new Date();
  const todayIso = isoDate(today);
  const start = new Date(today);
  start.setDate(start.getDate() - RECENT_DAYS);
  const rangeStartIso = isoDate(start);

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

  const eligibleUsers = (users ?? []).filter((user) => user.jira_account_id);
  if (eligibleUsers.length === 0) {
    console.log(JSON.stringify({ sent: false, reason: "no_eligible_users" }, null, 2));
    return;
  }

  const { data: logs, error: logsError } = await supabase
    .from("mood_logs")
    .select("user_id, score, logged_at")
    .in("user_id", eligibleUsers.map((user) => user.id))
    .gte("logged_at", `${rangeStartIso}T00:00:00+09:00`)
    .lte("logged_at", `${todayIso}T23:59:59+09:00`)
    .order("logged_at", { ascending: true });

  if (logsError) throw new Error(logsError.message);

  const issues = await fetchOpenIssuesForAssignees(eligibleUsers.map((user) => user.jira_account_id));
  const issuesByAssignee = new Map();
  for (const issue of issues) {
    const accountId = issue.assigneeAccountId;
    if (!accountId) continue;
    const existing = issuesByAssignee.get(accountId) ?? [];
    existing.push(issue);
    issuesByAssignee.set(accountId, existing);
  }

  const teamNameById = new Map((teams ?? []).map((team) => [team.id, team.name]));
  const partNameById = new Map((parts ?? []).map((part) => [part.id, part.name]));
  const logsByUser = new Map();
  for (const log of logs ?? []) {
    const existing = logsByUser.get(log.user_id) ?? [];
    existing.push(log);
    logsByUser.set(log.user_id, existing);
  }

  const targets = eligibleUsers.flatMap((user) => {
    const userLogs = logsByUser.get(user.id) ?? [];
    const latestByDay = new Map();
    for (const log of userLogs) {
      latestByDay.set(utcToKstDate(log.logged_at), log.score);
    }

    const todayScore = latestByDay.get(todayIso) ?? null;
    if (todayScore === null || todayScore > LOW_SCORE_THRESHOLD) return [];

    const priorScores = [];
    for (let offset = 1; offset <= RECENT_DAYS; offset += 1) {
      const day = new Date(today);
      day.setDate(day.getDate() - offset);
      const score = latestByDay.get(isoDate(day));
      if (score != null) priorScores.push(score);
    }

    const priorAverage = average(priorScores);
    const recentDelta = priorAverage == null ? null : todayScore - priorAverage;
    const memberIssues = issuesByAssignee.get(user.jira_account_id) ?? [];
    const blockerCount = memberIssues.filter((ticket) => isBlockerStatus(ticket.status)).length;
    const openTicketCount = memberIssues.length;
    if (openTicketCount < HIGH_OPEN_TICKET_THRESHOLD && blockerCount < 1) return [];

    return [{
      name: user.name,
      teamName: teamNameById.get(user.team_id) ?? "미지정 팀",
      partName: partNameById.get(user.part_id) ?? null,
      todayScore,
      recentDelta,
      openTicketCount,
      blockerCount,
      level: todayScore <= 40 || blockerCount > 0 ? "critical" : "warning",
      tickets: memberIssues.slice(0, 2),
    }];
  });

  if (targets.length === 0) {
    console.log(JSON.stringify({ sent: false, reason: "no_targets" }, null, 2));
    return;
  }

  const criticalCount = targets.filter((target) => target.level === "critical").length;
  const content = {
    body: [
      { type: "TextBlock", text: `주의 필요 팀원 ${targets.length}명`, weight: "Bolder", size: "Medium" },
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
      { type: "Action.OpenUrl", title: "어드민 열기", url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin` },
    ],
  };

  const response = await sendTeamsAdaptiveCard(content);
  console.log(JSON.stringify({ sent: true, response, targetCount: targets.length, criticalCount }, null, 2));
}

function loadEnvFile(relativePath) {
  const envPath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(envPath)) return;
  const contents = fs.readFileSync(envPath, "utf8");
  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function utcToKstDate(utcStr) {
  const d = new Date(utcStr);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function average(values) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function isBlockerStatus(status) {
  const normalized = String(status ?? "").toLowerCase();
  return BLOCKER_STATUS_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

async function fetchOpenIssuesForAssignees(accountIds) {
  const uniqueIds = Array.from(new Set(accountIds.map((id) => String(id).trim()).filter(Boolean)));
  if (uniqueIds.length === 0) return [];
  const jqlAssignees = uniqueIds.map((id) => `"${id.replace(/"/g, '\\"')}"`).join(", ");
  const search = await jiraRequest("/rest/api/3/search/jql", {
    method: "POST",
    body: JSON.stringify({
      jql: `assignee in (${jqlAssignees}) AND statusCategory != Done ORDER BY updated DESC`,
      maxResults: 100,
      fields: ["summary", "status", "updated", "assignee"],
    }),
  });
  return (search.issues ?? []).map((issue) => ({
    key: issue.key,
    summary: issue.fields?.summary ?? "(제목 없음)",
    status: issue.fields?.status?.name ?? "Unknown",
    updated: issue.fields?.updated ?? null,
    assigneeAccountId: issue.fields?.assignee?.accountId ?? null,
  }));
}

function jiraRequest(pathname, init) {
  return httpsJson(new URL(pathname, process.env.JIRA_BASE_URL), {
    method: init?.method ?? "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${process.env.ATLASSIAN_EMAIL}:${process.env.ATLASSIAN_API_TOKEN}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: init?.body,
    rejectUnauthorized: !useInsecureTls,
  });
}

function sendTeamsAdaptiveCard(content) {
  return httpsText(new URL(process.env.TEAMS_WEBHOOK_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            ...content,
          },
        },
      ],
    }),
    rejectUnauthorized: !useInsecureTls,
  });
}

function httpsJson(url, options) {
  return httpsText(url, options).then((body) => JSON.parse(body));
}

function httpsText(url, options) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: options.method,
      headers: options.headers,
      rejectUnauthorized: options.rejectUnauthorized,
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTP ${response.statusCode ?? 0}: ${body}`));
          return;
        }
        resolve(body);
      });
    });
    request.on("error", reject);
    if (options.body) request.write(options.body);
    request.end();
  });
}

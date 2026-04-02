import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const NAME_MAP = {
  "테디": "김태영",
  "해리슨": "이재욱",
  "엠마": "최서윤",
  "제롬": "하연호",
  "레나": "류희영",
  "제프": "이상협",
  "리사": "이하림",
  "리아": "이예빈",
  "클로드": "안선혁",
  "사이먼": "김상우",
};

const argv = new Set(process.argv.slice(2));
const dryRun = argv.has("--dry-run");
const force = argv.has("--force");

loadEnvFile(".env.local");

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jiraBaseUrl = requiredEnv("JIRA_BASE_URL");
const jiraEmail = requiredEnv("ATLASSIAN_EMAIL");
const jiraApiToken = requiredEnv("ATLASSIAN_API_TOKEN");

const supabaseKey = supabaseServiceRoleKey ?? supabaseAnonKey;
if (!supabaseKey) {
  throw new Error("Missing required env: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
const supabase = createClient(supabaseUrl, supabaseKey);
const jiraAuthHeader = `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString("base64")}`;

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  if (!dryRun && !supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for persistent backfill writes. Run with --dry-run or add the service role key.",
    );
  }

  const myself = await jiraGet("/rest/api/3/myself");
  const teamLabel = inferTeamLabel(myself.displayName);
  console.log(`Using Jira team label: ${teamLabel}`);

  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, email, jira_account_id, jira_display_name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load users from Supabase: ${error.message}`);
  }

  const report = {
    updated: [],
    skipped: [],
    unmatched: [],
    ambiguous: [],
  };

  for (const user of users) {
    const jiraName = NAME_MAP[user.name];
    if (!jiraName) {
      report.unmatched.push({ user: user.name, reason: "name mapping missing" });
      continue;
    }

    if (!force && user.jira_account_id && user.email) {
      report.skipped.push({ user: user.name, reason: "already has email and jira_account_id" });
      continue;
    }

    const candidates = await searchJiraUsers(jiraName);
    const decision = chooseCandidate({
      candidates,
      jiraName,
      teamLabel,
      existingEmail: user.email,
    });

    if (decision.kind === "unmatched") {
      report.unmatched.push({ user: user.name, reason: decision.reason });
      continue;
    }

    if (decision.kind === "ambiguous") {
      report.ambiguous.push({
        user: user.name,
        reason: decision.reason,
        candidates: decision.candidates.map(formatCandidate),
      });
      continue;
    }

    const matched = decision.candidate;
    const payload = {
      email: matched.emailAddress ?? user.email,
      jira_account_id: matched.accountId,
      jira_display_name: matched.displayName ?? null,
      jira_avatar_url: matched.avatarUrls?.["48x48"] ?? null,
      jira_connected_at: new Date().toISOString(),
    };

    if (dryRun) {
      report.updated.push({
        user: user.name,
        mode: "dry-run",
        email: payload.email,
        jiraAccountId: payload.jira_account_id,
        jiraDisplayName: payload.jira_display_name,
      });
      continue;
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("users")
      .update(payload)
      .eq("id", user.id)
      .select("id");

    if (updateError) {
      report.unmatched.push({ user: user.name, reason: `update failed: ${updateError.message}` });
      continue;
    }

    if (!updatedRows || updatedRows.length !== 1) {
      report.unmatched.push({
        user: user.name,
        reason: "update affected 0 rows; check RLS or service role configuration",
      });
      continue;
    }

    report.updated.push({
      user: user.name,
      mode: "updated",
      email: payload.email,
      jiraAccountId: payload.jira_account_id,
      jiraDisplayName: payload.jira_display_name,
    });
  }

  printReport(report);
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function loadEnvFile(relativePath) {
  const envPath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");
  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }
    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function inferTeamLabel(displayName) {
  const pieces = String(displayName ?? "").trim().split(/\s+/);
  if (pieces.length < 2) {
    throw new Error(`Unable to infer team label from Jira displayName: ${displayName}`);
  }
  return pieces.slice(1).join(" ");
}

async function jiraGet(pathname, searchParams = new URLSearchParams()) {
  const url = new URL(pathname, jiraBaseUrl);
  if ([...searchParams.keys()].length > 0) {
    url.search = searchParams.toString();
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: jiraAuthHeader,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Jira request failed (${response.status} ${response.statusText}): ${body}`);
  }

  return response.json();
}

async function searchJiraUsers(query) {
  const data = await jiraGet(
    "/rest/api/3/user/search",
    new URLSearchParams({
      query,
      maxResults: "20",
    }),
  );

  return Array.isArray(data) ? data : [];
}

function chooseCandidate({ candidates, jiraName, teamLabel, existingEmail }) {
  const exactEmailMatches = candidates.filter((candidate) =>
    isSameEmail(candidate.emailAddress, existingEmail),
  );
  if (exactEmailMatches.length === 1) {
    return { kind: "matched", candidate: exactEmailMatches[0] };
  }
  if (exactEmailMatches.length > 1) {
    return {
      kind: "ambiguous",
      reason: "multiple candidates matched existing email",
      candidates: exactEmailMatches,
    };
  }

  const exactTeamMatches = candidates.filter((candidate) =>
    normalize(candidate.displayName) === normalize(`${jiraName} ${teamLabel}`),
  );
  if (exactTeamMatches.length === 1) {
    return { kind: "matched", candidate: exactTeamMatches[0] };
  }
  if (exactTeamMatches.length > 1) {
    return {
      kind: "ambiguous",
      reason: "multiple candidates matched exact team displayName",
      candidates: exactTeamMatches,
    };
  }

  const teamMatches = candidates.filter((candidate) => {
    const displayName = normalize(candidate.displayName);
    return displayName.startsWith(normalize(jiraName)) && displayName.includes(normalize(teamLabel));
  });

  if (teamMatches.length === 1) {
    return { kind: "matched", candidate: teamMatches[0] };
  }

  if (teamMatches.length > 1) {
    return {
      kind: "ambiguous",
      reason: "multiple candidates matched the same Jira team label",
      candidates: teamMatches,
    };
  }

  return {
    kind: "unmatched",
    reason: `no Jira candidate matched team label '${teamLabel}'`,
  };
}

function isSameEmail(left, right) {
  return normalize(left) !== "" && normalize(left) === normalize(right);
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function formatCandidate(candidate) {
  return {
    displayName: candidate.displayName ?? null,
    emailAddress: candidate.emailAddress ?? null,
    accountId: candidate.accountId ?? null,
  };
}

function printReport(report) {
  console.log("");
  console.log(`Updated: ${report.updated.length}`);
  for (const item of report.updated) {
    console.log(`- ${item.user}: ${item.email ?? "no-email"} -> ${item.jiraAccountId} (${item.mode})`);
  }

  console.log("");
  console.log(`Skipped: ${report.skipped.length}`);
  for (const item of report.skipped) {
    console.log(`- ${item.user}: ${item.reason}`);
  }

  console.log("");
  console.log(`Unmatched: ${report.unmatched.length}`);
  for (const item of report.unmatched) {
    console.log(`- ${item.user}: ${item.reason}`);
  }

  console.log("");
  console.log(`Ambiguous: ${report.ambiguous.length}`);
  for (const item of report.ambiguous) {
    console.log(`- ${item.user}: ${item.reason}`);
    for (const candidate of item.candidates) {
      console.log(`  * ${candidate.displayName ?? "unknown"} / ${candidate.emailAddress ?? "no-email"} / ${candidate.accountId ?? "no-accountId"}`);
    }
  }
}

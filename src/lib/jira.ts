import https from "node:https";

type JiraIssue = {
  key: string;
  fields?: {
    summary?: string | null;
    updated?: string | null;
    assignee?: { accountId?: string | null } | null;
    status?: { name?: string | null } | null;
    priority?: { name?: string | null } | null;
  } | null;
};

type JiraSearchResponse = {
  issues?: JiraIssue[];
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function getJiraBaseUrl() {
  return requiredEnv("JIRA_BASE_URL");
}

function getAuthHeader() {
  const email = requiredEnv("ATLASSIAN_EMAIL");
  const token = requiredEnv("ATLASSIAN_API_TOKEN");
  return `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
}

async function jiraFetch<T>(pathname: string, init?: RequestInit): Promise<T> {
  const url = new URL(pathname, getJiraBaseUrl());
  try {
    const body = await httpsRequest(url, {
      method: init?.method ?? "GET",
      headers: {
        Accept: "application/json",
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
        ...normalizeHeaders(init?.headers),
      },
      body: typeof init?.body === "string" ? init.body : undefined,
      rejectUnauthorized: !shouldAllowInsecureTls(),
    });
    return JSON.parse(body) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("self-signed certificate") || message.includes("SELF_SIGNED_CERT_IN_CHAIN")) {
      throw new Error("Jira TLS verification failed. Add JIRA_INSECURE_TLS=1 to .env.local in this environment.");
    }
    throw error;
  }
}

function shouldAllowInsecureTls() {
  return (
    process.env.JIRA_INSECURE_TLS === "1" ||
    process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0"
  );
}

function normalizeHeaders(headers: RequestInit["headers"]) {
  if (!headers) return {} as Record<string, string>;
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, String(value)]),
  );
}

function httpsRequest(
  url: URL,
  options: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    rejectUnauthorized: boolean;
  },
) {
  return new Promise<string>((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: options.method,
        headers: options.headers,
        rejectUnauthorized: options.rejectUnauthorized,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              new Error(
                `Jira request failed (${response.statusCode ?? 0} ${response.statusMessage ?? "Unknown"}): ${body}`,
              ),
            );
            return;
          }
          resolve(body);
        });
      },
    );

    request.on("error", reject);
    if (options.body) {
      request.write(options.body);
    }
    request.end();
  });
}

export async function fetchOpenIssuesForAssignees(accountIds: string[]) {
  const uniqueAccountIds = Array.from(new Set(accountIds.map((id) => id.trim()).filter(Boolean)));
  if (uniqueAccountIds.length === 0) {
    return [] as Array<{
      key: string;
      summary: string;
      status: string;
      priority: string | null;
      updated: string | null;
      assigneeAccountId: string | null;
      browseUrl: string;
    }>;
  }

  const jqlAssignees = uniqueAccountIds.map((id) => `"${id.replace(/"/g, '\\"')}"`).join(", ");
  const search = await jiraFetch<JiraSearchResponse>("/rest/api/3/search/jql", {
    method: "POST",
    body: JSON.stringify({
      jql: `assignee in (${jqlAssignees}) AND statusCategory != Done ORDER BY updated DESC`,
      maxResults: 100,
      fields: ["summary", "status", "priority", "updated", "assignee"],
    }),
  });

  return (search.issues ?? []).map((issue) => ({
    key: issue.key,
    summary: issue.fields?.summary ?? "(제목 없음)",
    status: issue.fields?.status?.name ?? "Unknown",
    priority: issue.fields?.priority?.name ?? null,
    updated: issue.fields?.updated ?? null,
    assigneeAccountId: issue.fields?.assignee?.accountId ?? null,
    browseUrl: `${getJiraBaseUrl()}/browse/${issue.key}`,
  }));
}

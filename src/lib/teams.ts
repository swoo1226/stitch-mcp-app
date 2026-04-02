import https from "node:https";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function shouldAllowInsecureTls() {
  return (
    process.env.TEAMS_INSECURE_TLS === "1" ||
    process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0"
  );
}

export async function sendTeamsAdaptiveCard(content: Record<string, unknown>) {
  const webhookUrl = requiredEnv("TEAMS_WEBHOOK_URL");
  const payload = {
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
  };

  return httpsRequest(new URL(webhookUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    rejectUnauthorized: !shouldAllowInsecureTls(),
  });
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
                `Teams webhook failed (${response.statusCode ?? 0} ${response.statusMessage ?? "Unknown"}): ${body}`,
              ),
            );
            return;
          }
          resolve(body);
        });
      },
    );

    request.on("error", (error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("self-signed certificate") || message.includes("SELF_SIGNED_CERT_IN_CHAIN")) {
        reject(new Error("Teams TLS verification failed. Add TEAMS_INSECURE_TLS=1 to .env.local in this environment."));
        return;
      }
      reject(error);
    });

    if (options.body) {
      request.write(options.body);
    }
    request.end();
  });
}


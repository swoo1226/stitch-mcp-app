import https from "node:https";
import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export function createSupabaseAdminClient() {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error("Missing required env: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: shouldAllowInsecureTls() ? insecureNodeFetch : fetch,
    },
  });
}

function shouldAllowInsecureTls() {
  return (
    process.env.SUPABASE_INSECURE_TLS === "1" ||
    process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0"
  );
}

async function insecureNodeFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" || input instanceof URL
    ? new URL(String(input))
    : new URL(input.url);
  const method = init?.method ?? (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET");
  const headers = normalizeHeaders(init?.headers ?? (typeof input !== "string" && !(input instanceof URL) ? input.headers : undefined));
  const body = typeof init?.body === "string"
    ? init.body
    : init?.body instanceof URLSearchParams
      ? init.body.toString()
      : undefined;

  return new Promise<Response>((resolve, reject) => {
    const request = https.request(
      url,
      {
        method,
        headers,
        rejectUnauthorized: false,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          resolve(new Response(Buffer.concat(chunks), {
            status: response.statusCode ?? 500,
            headers: response.headers as HeadersInit,
          }));
        });
      },
    );

    request.on("error", reject);
    if (body) {
      request.write(body);
    }
    request.end();
  });
}

function normalizeHeaders(headers: RequestInit["headers"] | Headers | undefined) {
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

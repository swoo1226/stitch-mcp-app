import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/request-access",
  "/input",
  "/sample",
  "/alerts",
  "/details",
  "/statistics",
  "/icon",
  "/icon.svg",
];

const DEMO_ALLOWED_PATHS = ["/dashboard", "/niko", "/personal"];

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // cron API는 route handler 내부 secret 검사로 보호한다.
  if (pathname.startsWith("/api/cron/")) {
    return NextResponse.next({ request: req });
  }

  // 공개 신청 API는 로그인 없이 접근 가능해야 한다.
  if (pathname === "/api/access-request") {
    return NextResponse.next({ request: req });
  }

  // 공개 경로
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return await updateSession(req);
  }

  // 데모 모드
  if (DEMO_ALLOWED_PATHS.includes(pathname)) {
    const teamParam = searchParams.get("team");
    const userParam = searchParams.get("user");
    if (teamParam === "demo" || userParam === "demo" || (!teamParam && !userParam)) {
      return await updateSession(req);
    }
  }

  // 세션 갱신 + 인증 체크
  const { response, user } = await updateSessionWithUser(req);

  if (!user) {
    const redirect = encodeURIComponent(pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(new URL(`/login?redirect=${redirect}`, req.nextUrl));
  }

  // 역할 기반 접근 제어는 AuthGuard(클라이언트)에서 처리
  // 미들웨어에서 user_roles 조회 시 RLS 순환 참조 문제가 있어 여기서는 세션 유무만 확인
  return response;
}

function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}

async function updateSession(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  try {
    const supabase = createMiddlewareClient(req, res);
    await supabase.auth.getUser();
  } catch {
    // Supabase fetch 실패 시 세션 갱신 없이 통과
  }
  return res;
}

async function updateSessionWithUser(req: NextRequest) {
  const response = NextResponse.next({ request: req });
  try {
    const supabase = createMiddlewareClient(req, response);
    const { data: { user } } = await supabase.auth.getUser();
    return { response, user };
  } catch {
    // Supabase fetch 실패 시 비인증 처리
    return { response, user: null };
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|icons/.*|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|js|json)).*)",
  ],
};

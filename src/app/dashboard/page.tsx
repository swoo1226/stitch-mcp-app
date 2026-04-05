import DashboardPageClient from "./DashboardPageClient";
import AuthGuard from "../components/AuthGuard";
import { getRequiredSearchParam } from "../lib/requiredSearchParam";
import { DEMO_TEAM_ID } from "../../lib/demo-data";
import { resolveTeamId } from "../../lib/resolve-session";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  let teamId = getRequiredSearchParam(params.team) ?? DEMO_TEAM_ID;

  // 쿼리 파라미터 없이 접근한 경우 로그인 세션에서 팀 자동 resolve
  if (teamId === DEMO_TEAM_ID) {
    const resolved = await resolveTeamId();
    if (resolved) teamId = resolved;
  }

  const isDemo = teamId === DEMO_TEAM_ID;

  // demo 모드는 인증 없이 접근 가능
  if (isDemo) {
    return <DashboardPageClient teamId={teamId} />;
  }

  // 실제 팀: 로그인 필요 (역할 무관)
  return (
    <AuthGuard>
      <DashboardPageClient teamId={teamId} />
    </AuthGuard>
  );
}

import MonthlyReportClient from "./MonthlyReportClient";
import AuthGuard from "../../components/AuthGuard";
import PullToRefresh from "../../components/PullToRefresh";
import { getRequiredSearchParam } from "../../lib/requiredSearchParam";
import { DEMO_TEAM_ID } from "../../../lib/demo-data";
import { resolveTeamId } from "../../../lib/resolve-session";

export const dynamic = "force-dynamic";

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const isExplicitDemo = getRequiredSearchParam(params.team) === DEMO_TEAM_ID;
  let teamId = getRequiredSearchParam(params.team) ?? DEMO_TEAM_ID;

  if (!isExplicitDemo && teamId === DEMO_TEAM_ID) {
    const resolved = await resolveTeamId();
    if (resolved) teamId = resolved;
  }

  const isDemo = teamId === DEMO_TEAM_ID;

  const content = <MonthlyReportClient teamId={teamId} />;

  if (isDemo) {
    return <PullToRefresh>{content}</PullToRefresh>;
  }

  return (
    <AuthGuard>
      <PullToRefresh>
        {content}
      </PullToRefresh>
    </AuthGuard>
  );
}

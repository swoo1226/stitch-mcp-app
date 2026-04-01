import DashboardPageClient from "./DashboardPageClient";
import AuthGuard from "../components/AuthGuard";
import { getRequiredSearchParam } from "../lib/requiredSearchParam";
import { DEMO_TEAM_ID } from "../../lib/demo-data";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const teamId = getRequiredSearchParam(params.team) ?? DEMO_TEAM_ID;
  const needsAuth = teamId !== DEMO_TEAM_ID;

  if (needsAuth) {
    return (
      <AuthGuard>
        <DashboardPageClient teamId={teamId} />
      </AuthGuard>
    );
  }

  return <DashboardPageClient teamId={teamId} />;
}

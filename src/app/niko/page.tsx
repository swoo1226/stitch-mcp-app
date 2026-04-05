import NikoPageClient from "./NikoPageClient";
import AuthGuard from "../components/AuthGuard";
import { getRequiredSearchParam } from "../lib/requiredSearchParam";
import { DEMO_TEAM_ID } from "../../lib/demo-data";
import { resolveTeamId } from "../../lib/resolve-session";

export default async function NikoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  let teamId = getRequiredSearchParam(params.team) ?? DEMO_TEAM_ID;

  if (teamId === DEMO_TEAM_ID) {
    const resolved = await resolveTeamId();
    if (resolved) teamId = resolved;
  }

  const isDemo = teamId === DEMO_TEAM_ID;

  if (isDemo) {
    return <NikoPageClient teamId={teamId} />;
  }

  return (
    <AuthGuard>
      <NikoPageClient teamId={teamId} />
    </AuthGuard>
  );
}

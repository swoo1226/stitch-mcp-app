import PersonalPageClient from "./PersonalPageClient";
import AuthGuard from "../components/AuthGuard";
import { getRequiredSearchParam } from "../lib/requiredSearchParam";
import { DEMO_USER_ID, DEMO_TEAM_ID } from "../../lib/demo-data";

export default async function PersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const userId = getRequiredSearchParam(params.user) ?? DEMO_USER_ID;
  const teamId = getRequiredSearchParam(params.team) ?? null;

  const needsAuth =
    userId !== DEMO_USER_ID ||
    (teamId !== null && teamId !== DEMO_TEAM_ID);

  if (needsAuth) {
    return (
      <AuthGuard>
        <PersonalPageClient userId={userId} teamId={teamId} />
      </AuthGuard>
    );
  }

  return <PersonalPageClient userId={userId} teamId={teamId} />;
}

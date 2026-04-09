import PersonalPageClient from "./PersonalPageClient";
import AuthGuard from "../components/AuthGuard";
import { getRequiredSearchParam } from "../lib/requiredSearchParam";
import { DEMO_USER_ID } from "../../lib/demo-data";
import { resolveUserId } from "../../lib/resolve-session";

export default async function PersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const isExplicitDemo = getRequiredSearchParam(params.user) === DEMO_USER_ID;
  let userId = getRequiredSearchParam(params.user) ?? DEMO_USER_ID;

  if (!isExplicitDemo && userId === DEMO_USER_ID) {
    const resolved = await resolveUserId();
    if (resolved) userId = resolved;
  }

  const isDemo = userId === DEMO_USER_ID;

  if (isDemo) {
    return <PersonalPageClient userId={userId} />;
  }

  return (
    <AuthGuard>
      <PersonalPageClient userId={userId} />
    </AuthGuard>
  );
}

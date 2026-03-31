import { notFound } from "next/navigation";
import DashboardPageClient from "./DashboardPageClient";
import { getRequiredSearchParam } from "../lib/requiredSearchParam";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const teamId = getRequiredSearchParam(params.team);

  if (!teamId) {
    notFound();
  }

  return <DashboardPageClient teamId={teamId} />;
}

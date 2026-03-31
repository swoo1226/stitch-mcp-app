import { notFound } from "next/navigation";
import NikoPageClient from "./NikoPageClient";
import { getRequiredSearchParam } from "../lib/requiredSearchParam";

export default async function NikoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const teamId = getRequiredSearchParam(params.team);

  if (!teamId) {
    notFound();
  }

  return <NikoPageClient teamId={teamId} />;
}

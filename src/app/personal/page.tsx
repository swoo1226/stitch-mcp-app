import { notFound } from "next/navigation";
import PersonalPageClient from "./PersonalPageClient";
import { getRequiredSearchParam } from "../lib/requiredSearchParam";

export default async function PersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const userId = getRequiredSearchParam(params.user);

  if (!userId) {
    notFound();
  }

  return <PersonalPageClient userId={userId} />;
}

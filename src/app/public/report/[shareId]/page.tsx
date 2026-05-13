import PublicReportClient from "./PublicReportClient";

export default function PublicReportPage({
  params,
}: {
  params: { shareId: string };
}) {
  return <PublicReportClient shareId={params.shareId} />;
}

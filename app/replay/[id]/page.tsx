import ReplayViewer from "./ReplayViewer";

export const runtime = "nodejs";

export default async function ReplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReplayViewer id={id} />;
}

import { Dashboard } from '@/components/dashboard';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Dashboard endpointId={id} />;
}

export const dynamic = 'force-dynamic';

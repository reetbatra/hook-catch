import { Dashboard } from '@/components/dashboard';

export default async function ReadOnlyDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Dashboard endpointId={id} readonly />;
}

export const dynamic = 'force-dynamic';

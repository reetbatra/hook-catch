import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ endpointId: string }> }
) {
  const { endpointId } = await params;
  const supabase = createServerClient();

  // Verify endpoint exists and isn't expired
  const { data: endpoint, error: epError } = await supabase
    .from('endpoints')
    .select('id, expires_at')
    .or(`id.eq.${endpointId},readonly_id.eq.${endpointId}`)
    .single();

  if (epError || !endpoint) {
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  }

  if (new Date(endpoint.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Endpoint expired' }, { status: 410 });
  }

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('endpoint_id', endpoint.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events, endpoint });
}

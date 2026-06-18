import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const HOP_BY_HOP_HEADERS = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailers', 'transfer-encoding', 'upgrade', 'host', 'content-length',
]);

export async function POST(request: NextRequest) {
  const { eventId, targetUrl } = await request.json();

  if (!eventId || !targetUrl) {
    return NextResponse.json({ error: 'Missing eventId or targetUrl' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid target URL' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Build headers, stripping hop-by-hop
  const forwardHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(event.headers as Record<string, string>)) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      forwardHeaders[key] = value;
    }
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      method: event.method,
      headers: forwardHeaders,
      body: event.method !== 'GET' && event.method !== 'HEAD' ? event.body : undefined,
    });

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Request failed' },
      { status: 502 }
    );
  }
}

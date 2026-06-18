import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const method = request.method;

  // Redirect browser GETs to the dashboard
  if (method === 'GET') {
    const accept = request.headers.get('accept') ?? '';
    const ua = request.headers.get('user-agent') ?? '';
    if (accept.includes('text/html') && ua.includes('Mozilla')) {
      return NextResponse.redirect(new URL(`/d/${id}`, request.url));
    }
  }

  // Capture the webhook
  const supabase = createServerClient();

  // Verify endpoint exists and isn't expired
  const { data: endpoint } = await supabase
    .from('endpoints')
    .select('id, expires_at')
    .eq('id', id)
    .single();

  if (!endpoint || new Date(endpoint.expires_at) < new Date()) {
    // Return 200 to avoid breaking sender retry logic
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Read body
  let body: string | null = null;
  let parsedBody: Record<string, unknown> | null = null;
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (method !== 'GET' && method !== 'HEAD') {
      body = await request.text();
      if (body && contentType.includes('application/json')) {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          // not valid JSON, store as raw
        }
      }
    }
  } catch {
    // ignore body read errors
  }

  // Collect headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  // Collect query params
  const queryParams: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  // Extract source IP
  const sourceIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null;

  // Insert event (fire-and-forget approach — we still await but don't block response on error)
  await supabase.from('events').insert({
    endpoint_id: id,
    method,
    headers,
    body,
    parsed_body: parsedBody,
    source_ip: sourceIp,
    query_params: Object.keys(queryParams).length > 0 ? queryParams : null,
  });

  return NextResponse.json({ received: true }, { status: 200 });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};

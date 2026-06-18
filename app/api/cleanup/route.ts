import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  return handler();
}

export async function POST() {
  return handler();
}

async function handler() {
  const supabase = createServerClient();

  const { error, count } = await supabase
    .from('endpoints')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: count ?? 0, timestamp: new Date().toISOString() });
}

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateId } from '@/lib/id';

export async function POST() {
  const supabase = createServerClient();
  const id = generateId();
  const readonlyId = generateId();

  const { data, error } = await supabase
    .from('endpoints')
    .insert({ id, readonly_id: readonlyId })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

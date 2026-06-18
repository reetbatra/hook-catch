import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Browser client (anon key) — for client components and realtime
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Server client (service role) — for API routes, bypasses RLS
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

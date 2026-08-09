import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { Database } from '../types/database';

/**
 * Two Supabase clients:
 *
 * `supabaseAnon`  — Uses the anon key. Honours Row Level Security (RLS).
 *                   Used for public / user-scoped queries.
 *
 * `supabaseAdmin` — Uses the service role key. BYPASSES RLS.
 *                   Used ONLY in server-side admin operations where full
 *                   table access is required and we have already verified
 *                   authorization ourselves (middleware layer).
 *
 * Never expose supabaseAdmin to the client.
 */
export const supabaseAnon = createClient<any>(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: { persistSession: false },
    db: { schema: 'public' },
  }
);

export const supabaseAdmin = createClient<any>(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: { schema: 'public' },
  }
);

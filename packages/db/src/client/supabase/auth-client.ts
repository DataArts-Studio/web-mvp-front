import { type SupabaseClient, createClient } from '@supabase/supabase-js';

import type { Database } from './types';

let browserAuthClient: SupabaseClient<Database> | null = null;

export const createSupabaseBrowserAuthClient = () => {
  if (browserAuthClient) return browserAuthClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Publishable Key is missing in environment variables.');
  }

  browserAuthClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'testea-auth',
    },
  });

  return browserAuthClient;
};

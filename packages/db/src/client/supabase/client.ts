import { createClient } from '@supabase/supabase-js';
import { SUPABASE_AUTH_OPTIONS } from './config';
import type { Database } from './types';

export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경변수 체크
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Anon Key is missing in environment variables.');
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: SUPABASE_AUTH_OPTIONS,
  });
};
import { ENV } from '@/shared/constants';
import { Database } from '@/shared/lib/supabase/schema';
import { SUPABASE_AUTH_OPTIONS } from '@/shared/lib/supabase/config';
import { createClient } from '@supabase/supabase-js';

export const createSupabaseClient = () => {
  const supabaseUrl = ENV.CLIENT.SUPABASE_URL!;
  const supabaseKey = ENV.CLIENT.SUPABASE_ANON_KEY!;

  // 환경변수 체크
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Anon Key is missing in environment variables.');
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: SUPABASE_AUTH_OPTIONS,
  });
};
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/shared/lib/supabase/schema';
import { ENV } from '@/shared/constants/env';

const supabaseUrl = ENV.CLIENT.SUPABASE_URL!;
const supabaseKey = ENV.CLIENT.SUPABASE_ANON_KEY!;

// 환경변수 체크
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or Anon Key is missing in environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
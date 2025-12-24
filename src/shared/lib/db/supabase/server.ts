'use server';
import { ENV } from '@/shared/constants/infra/env';
import { Database } from '@/shared/lib/db';
import { SUPABASE_AUTH_OPTIONS } from '@/shared/lib/db/supabase/config';
import { createClient } from '@supabase/supabase-js';

// 서버 컴포넌트, 서버 액션, 라우트 핸들러에서 사용
export const createSupabaseServerClient = async () => {
  const supabaseUrl = ENV.SERVER.SUPABASE_URL;
  const supabaseServiceKey = ENV.SERVER.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL or Service Key is missing in environment variables.');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      ...SUPABASE_AUTH_OPTIONS,
      persistSession: false,
    },
  });
};

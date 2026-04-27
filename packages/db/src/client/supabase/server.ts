'use server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_AUTH_OPTIONS } from './config';
import type { Database } from './types';

// 서버 컴포넌트, 서버 액션, 라우트 핸들러에서 사용
export const createSupabaseServerClient = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

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

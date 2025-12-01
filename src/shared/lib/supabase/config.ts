import type { SupabaseClientOptions } from '@supabase/supabase-js';
import { Database } from '@/shared/lib/supabase/schema';

// Supabase 옵션 전체를 상수로 관리하고 싶으면 이 타입 이용
export type SupabaseOptions = SupabaseClientOptions<Database>;

// auth 옵션만 먼저 분리 (필요하면 나중에 확장)
export const SUPABASE_AUTH_OPTIONS: SupabaseOptions['auth'] = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
} as const;

import { createBrowserClient } from '@supabase/ssr';

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase Auth 클라이언트.
 * 세션은 @supabase/ssr 가 쿠키로 관리한다(localStorage 아님).
 *
 * 필요 환경변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되어야 합니다. .env.local 확인.'
    );
  }

  return createBrowserClient(url, anonKey);
}

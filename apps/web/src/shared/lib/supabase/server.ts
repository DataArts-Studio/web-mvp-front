import { cookies } from 'next/headers';

import { createServerClient } from '@supabase/ssr';

/**
 * 서버(서버 컴포넌트·서버 액션·라우트 핸들러)용 Supabase Auth 클라이언트.
 * Next 쿠키 스토어에 세션을 읽고 쓴다.
 *
 * 필요 환경변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export async function createSupabaseServerAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되어야 합니다. .env.local 확인.'
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // 서버 컴포넌트 렌더 중에는 쿠키 쓰기가 불가하다.
          // 세션 갱신은 라우트 핸들러/서버 액션에서 처리되므로 여기서는 무시한다.
        }
      },
    },
  });
}

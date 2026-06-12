import { NextResponse } from 'next/server';

import { createSupabaseServerAuthClient } from '@/shared/lib/supabase';

/**
 * OAuth 콜백. 프로바이더가 돌려준 code 를 세션으로 교환한 뒤 next(기본 '/')로 이동.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // 오픈 리다이렉트 방지: 동일 출처 내부 경로만 허용
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';

  if (code) {
    const supabase = await createSupabaseServerAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

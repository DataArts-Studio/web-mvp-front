'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createSupabaseServerAuthClient } from '@/shared/lib/supabase';

export type OAuthProvider = 'google' | 'github';

/**
 * 소셜 로그인 시작. 프로바이더 OAuth 동의 화면으로 리다이렉트한다.
 * 동의 후 프로바이더는 `${origin}/auth/callback` 으로 코드를 돌려준다.
 */
export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = await createSupabaseServerAuthClient();

  const headerList = await headers();
  const origin = headerList.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? '';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data?.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? 'oauth_init_failed')}`);
  }

  redirect(data.url);
}

/** 폼 action 으로 바로 쓰기 위한 프로바이더별 래퍼 */
export async function signInWithGoogle() {
  await signInWithOAuth('google');
}

export async function signInWithGithub() {
  await signInWithOAuth('github');
}

/** 로그아웃 후 로그인 화면으로 */
export async function signOut() {
  const supabase = await createSupabaseServerAuthClient();
  await supabase.auth.signOut();
  redirect('/login');
}

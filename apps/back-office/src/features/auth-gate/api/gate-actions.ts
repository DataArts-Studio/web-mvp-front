'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { logAdminActivity } from '@/features/admin-log/log';
import { initCloudflareDb } from '@/shared/db/cloudflare-db';

import { ADMIN_COOKIE, isValidSecret } from '../lib/admin-gate';

export type GateState = { error?: string };

/** 게이트 폼 제출 후 안전한 내부 경로만 허용 (open redirect 차단). */
function safeRedirect(raw: FormDataEntryValue | null): string {
  const value = typeof raw === 'string' ? raw : '';
  return value.startsWith('/') && !value.startsWith('//') ? value : '/notices';
}

/**
 * 운영자 공유키 검증 후 세션 쿠키 발급.
 * useActionState 시그니처: (prevState, formData) => state.
 */
export async function signInAdminAction(_prev: GateState, formData: FormData): Promise<GateState> {
  const secret = formData.get('secret');
  const candidate = typeof secret === 'string' ? secret : '';

  if (!isValidSecret(candidate)) {
    return { error: '키가 올바르지 않습니다.' };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, candidate, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8시간
  });

  initCloudflareDb();
  await logAdminActivity({ action: 'login' });

  redirect(safeRedirect(formData.get('redirect')));
}

/** 세션 종료. */
export async function signOutAdminAction(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect('/notices/gate');
}

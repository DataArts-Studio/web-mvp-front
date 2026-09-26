'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getClientIp, logAdminActivity } from '@/features/admin-log/log';
import { initCloudflareDb } from '@/shared/db/cloudflare-db';
import { countRecentFailedLogins, countRecentFailedLoginsGlobal } from '@testea/db';

import { ADMIN_COOKIE, isValidSecret } from '../lib/admin-gate';

export type GateState = { error?: string };

// 브루트포스 방어. admin_activity_logs(DB) 기반이라 Workers 다중 isolate 에서도 동작한다.
// - IP 단위: 같은 IP 가 LOCK_WINDOW_MIN 분 안에 LOCK_THRESHOLD 회 실패하면 잠근다.
//   IP 는 위조 불가한 cf-connecting-ip 만 쓴다(log.ts).
// - 전역: IP 를 바꿔 가며 시도하는 분산 공격을 막기 위해 전체 실패 수에도 상한을 둔다.
//   정상 운영자까지 잠시 막힐 수 있으나, 공유키 대입을 허용하는 것보다 낫다.
const LOCK_THRESHOLD = 5;
const GLOBAL_LOCK_THRESHOLD = 50;
const LOCK_WINDOW_MIN = 15;
const LOCKED_MESSAGE = `시도가 너무 많습니다. 약 ${LOCK_WINDOW_MIN}분 후 다시 시도해주세요.`;

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
  // 런타임에 맞는 DB 준비(Workers=Hyperdrive, 그 외 no-op). 락아웃 조회·기록에 필요.
  initCloudflareDb();

  const secret = formData.get('secret');
  const candidate = typeof secret === 'string' ? secret : '';
  const ip = await getClientIp();

  // 락아웃: 키 검증 전에 차단해, 잠긴 동안에는 맞는 키도 확인해 주지 않는다.
  const [ipFailures, globalFailures] = await Promise.all([
    countRecentFailedLogins(ip, LOCK_WINDOW_MIN),
    countRecentFailedLoginsGlobal(LOCK_WINDOW_MIN),
  ]);
  if (ipFailures >= LOCK_THRESHOLD || globalFailures >= GLOBAL_LOCK_THRESHOLD) {
    return { error: LOCKED_MESSAGE };
  }

  if (!isValidSecret(candidate)) {
    await logAdminActivity({ action: 'login.failed' });
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

  await logAdminActivity({ action: 'login' });

  redirect(safeRedirect(formData.get('redirect')));
}

/** 세션 종료. */
export async function signOutAdminAction(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect('/notices/gate');
}

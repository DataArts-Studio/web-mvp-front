'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getClientIp, logAdminActivity } from '@/features/admin-log/log';
import { initCloudflareDb } from '@/shared/db/cloudflare-db';
import { countRecentFailedLogins, releaseFailedLogin, reserveFailedLogin } from '@testea/db';

import { ADMIN_COOKIE, isValidSecret } from '../lib/admin-gate';

export type GateState = { error?: string };

// 브루트포스 방어. admin_activity_logs(DB) 기반이라 Workers 다중 isolate 에서도 동작한다.
// 같은 IP 가 LOCK_WINDOW_MIN 분 안에 LOCK_THRESHOLD 회를 넘겨 실패하면 잠근다. IP 는 위조 불가한
// cf-connecting-ip 만 쓴다(log.ts). 전체 실패 수로 잠그는 전역 잠금은 두지 않는다: 누구나 실패를
// 쌓아 모든 운영자 로그인을 막을 수 있기 때문이다.
const LOCK_THRESHOLD = 5;
const LOCK_WINDOW_MIN = 15;
const LOCKED_MESSAGE = `시도가 너무 많습니다. 약 ${LOCK_WINDOW_MIN}분 후 다시 시도해주세요.`;
const UNAVAILABLE_MESSAGE = '지금은 로그인을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.';

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

  // 시도를 먼저 실패로 기록(예약)한 뒤 센다. 세고 나서 기록하면 동시 요청이 같은 개수를 보고
  // 모두 통과한다. 기록·조회가 실패하면 로그인을 거부한다(fail-closed).
  let reservationId: string;
  let failures: number;
  try {
    reservationId = await reserveFailedLogin(ip);
    failures = await countRecentFailedLogins(ip, LOCK_WINDOW_MIN);
  } catch (error) {
    console.error('[auth-gate] 로그인 시도 기록 실패', error);
    return { error: UNAVAILABLE_MESSAGE };
  }

  // 잠긴 동안에는 맞는 키도 확인해 주지 않는다. failures 는 이번 시도를 포함한다.
  if (failures > LOCK_THRESHOLD) {
    return { error: LOCKED_MESSAGE };
  }

  if (!isValidSecret(candidate)) {
    return { error: '키가 올바르지 않습니다.' };
  }

  // 성공한 시도는 실패 기록에서 뺀다. 지우지 못해도 로그인은 진행한다(실패 1건이 더 남을 뿐).
  await releaseFailedLogin(reservationId).catch((error) => {
    console.error('[auth-gate] 로그인 시도 기록 정리 실패', error);
  });

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

import { headers } from 'next/headers';

import { type AdminActivityInput, recordAdminActivity } from '@testea/db';

/** 신뢰 헤더에서 클라이언트 IP 를 추출한다. 추출 실패 시 null. */
export async function getClientIp(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * 관리자 활동을 기록한다. 클라이언트 IP 를 함께 남긴다.
 * 로깅 실패가 주 동작(로그인·공지 변경)을 막지 않도록 내부에서 swallow 한다.
 */
export async function logAdminActivity(input: Omit<AdminActivityInput, 'ip'>): Promise<void> {
  try {
    await recordAdminActivity({ ...input, ip: await getClientIp() });
  } catch (error) {
    console.error('[admin-log] 활동 기록 실패', error);
  }
}

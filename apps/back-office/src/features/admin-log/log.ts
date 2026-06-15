import { headers } from 'next/headers';

import { type AdminActivityInput, recordAdminActivity } from '@testea/db';

/**
 * 관리자 활동을 기록한다. 신뢰 헤더에서 클라이언트 IP 를 추출해 함께 남긴다.
 * 로깅 실패가 주 동작(로그인·공지 변경)을 막지 않도록 내부에서 swallow 한다.
 */
export async function logAdminActivity(input: Omit<AdminActivityInput, 'ip'>): Promise<void> {
  try {
    const h = await headers();
    const ip =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim() || null;
    await recordAdminActivity({ ...input, ip });
  } catch (error) {
    console.error('[admin-log] 활동 기록 실패', error);
  }
}

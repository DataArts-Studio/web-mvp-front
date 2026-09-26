import { headers } from 'next/headers';

import { getCfAccessEmail } from '@/features/auth-gate/lib/cf-access';
import { type AdminActivityInput, recordAdminActivity } from '@testea/db';

/**
 * 클라이언트 IP 를 추출한다. 락아웃 키와 감사 로그에 쓰므로 위조할 수 없는 값만 신뢰한다.
 *
 * - `cf-connecting-ip`: Cloudflare 가 엣지에서 설정하고 클라이언트 값을 덮어쓴다. 백오피스는
 *   Cloudflare Workers 로 배포되므로 운영에서는 항상 이 값이 있다.
 * - `x-forwarded-for` 는 쓰지 않는다. 첫 값은 클라이언트가 임의로 넣을 수 있어, 요청마다 바꿔
 *   IP 단위 락아웃을 우회하고 로그 IP 를 위조할 수 있다.
 *
 * 추출 실패(로컬 등) 시 null.
 */
export async function getClientIp(): Promise<string | null> {
  try {
    return (await headers()).get('cf-connecting-ip')?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * 관리자 활동을 기록한다. 클라이언트 IP 와 행위자(CF Access 이메일)를 함께 남긴다.
 * 로깅 실패가 주 동작(로그인·공지 변경)을 막지 않도록 내부에서 swallow 한다.
 */
export async function logAdminActivity(
  input: Omit<AdminActivityInput, 'ip' | 'actor'>
): Promise<void> {
  try {
    const [ip, actor] = await Promise.all([getClientIp(), getCfAccessEmail()]);
    await recordAdminActivity({ ...input, ip, actor });
  } catch (error) {
    console.error('[admin-log] 활동 기록 실패', error);
  }
}

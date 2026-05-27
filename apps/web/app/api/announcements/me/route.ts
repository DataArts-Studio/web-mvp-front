import { NextResponse } from 'next/server';

import { readAnonId } from '@/shared/lib/anon-id';
import { getActiveAnnouncementsWithReadState } from '@testea/db';

export const dynamic = 'force-dynamic';

/**
 * 현재 익명 사용자 기준 활성 공지 + 본인 읽음 상태 반환.
 *
 * 공개 GET /api/announcements 와 달리 per-user 응답이라 캐싱하지 않는다.
 * 쿠키가 없으면 빈 user 식별로 처리 → `readAt` 은 모두 `null` (전체 미읽음 취급).
 */
export async function GET() {
  try {
    const anonId = await readAnonId();
    // 쿠키가 없으면 임의 zero-uuid 로 조회. LEFT JOIN 결과는 어차피 매치되지 않아
    // 모든 readAt 이 null 로 나온다. 본인 읽음 정보 노출 없음.
    const items = await getActiveAnnouncementsWithReadState(
      anonId ?? '00000000-0000-0000-0000-000000000000'
    );
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[GET /api/announcements/me] failed', error);
    return NextResponse.json({ error: '공지 조회에 실패했습니다.' }, { status: 500 });
  }
}

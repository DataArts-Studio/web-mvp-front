import { NextResponse } from 'next/server';

import { readAnonId } from '@/shared/lib/anon-id';
import { countUnreadAnnouncements } from '@testea/db';

export const dynamic = 'force-dynamic';

/**
 * 현재 익명 사용자의 미읽음 활성 공지 개수.
 *
 * 쿠키가 아직 없으면(미인증) 활성 공지를 전부 unread 로 간주하지 않고 0 으로 응답한다.
 * 첫 진입 사용자에게 뱃지 깜빡임을 만들지 않기 위함. 읽음 추적은 첫 `POST /:id/read`
 * 호출 시 쿠키가 발급되면서 시작된다.
 */
export async function GET() {
  try {
    const anonId = await readAnonId();
    if (!anonId) {
      return NextResponse.json({ count: 0 }, { headers: noStore() });
    }
    const count = await countUnreadAnnouncements(anonId);
    return NextResponse.json({ count }, { headers: noStore() });
  } catch (error) {
    console.error('[GET /api/announcements/unread-count] query failed', error);
    return NextResponse.json({ error: '미읽음 수 조회에 실패했습니다.' }, { status: 500 });
  }
}

function noStore() {
  return { 'Cache-Control': 'no-store' };
}

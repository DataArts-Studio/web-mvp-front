import { NextResponse } from 'next/server';

import { ensureAnonId } from '@/shared/lib/anon-id';
import { markAnnouncementRead } from '@testea/db';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 공지 읽음 처리. 멱등 (재호출 시 에러 없음).
 *
 * - 익명 쿠키가 없으면 이 호출에서 발급한다.
 * - 형식이 잘못된 announcement id 는 400.
 * - 실제 row 존재 여부와 무관하게 200 으로 응답한다 (정보 노출 최소화).
 */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  try {
    const anonId = await ensureAnonId();
    await markAnnouncementRead(anonId, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[POST /api/announcements/:id/read] failed', error);
    return NextResponse.json({ error: '읽음 처리에 실패했습니다.' }, { status: 500 });
  }
}

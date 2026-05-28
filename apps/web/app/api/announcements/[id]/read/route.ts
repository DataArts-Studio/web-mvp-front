import { NextResponse } from 'next/server';

import { ensureAnonId } from '@/shared/lib/anon-id';
import { markAnnouncementRead } from '@testea/db';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Postgres foreign_key_violation. 존재하지 않거나 삭제된 공지를 읽음 처리할 때 발생.
function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23503'
  );
}

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
    // row 존재 여부와 무관하게 멱등 성공으로 응답한다 (정책 + 정보 노출 최소화).
    // 없는/삭제된 공지의 FK 위반은 흡수하고, 그 외 오류만 500.
    if (isForeignKeyViolation(error)) {
      return new NextResponse(null, { status: 204 });
    }
    console.error('[POST /api/announcements/:id/read] failed', error);
    return NextResponse.json({ error: '읽음 처리에 실패했습니다.' }, { status: 500 });
  }
}

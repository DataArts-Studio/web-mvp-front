import { NextResponse } from 'next/server';

import {
  type AnnouncementSeverity,
  announcementSeverityEnum,
  getActiveAnnouncements,
} from '@testea/db';

export const dynamic = 'force-dynamic';

/**
 * 공개 활성 공지 조회 라우트.
 *
 * - 쿼리: `severity` (info|warning|critical), `limit` (1~50)
 * - 응답: `{ items: PublicAnnouncement[] }`
 * - RLS deny-all 정책 하에 service_role 로 직접 조회. 만료·미발행은 응답에서 제외.
 *
 * 예시:
 *   GET /api/announcements
 *   GET /api/announcements?severity=critical&limit=1
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  const severityParam = url.searchParams.get('severity');
  const severity = isValidSeverity(severityParam) ? severityParam : undefined;

  const limitParam = url.searchParams.get('limit');
  const limit = parseLimit(limitParam);

  try {
    const items = await getActiveAnnouncements({ severity, limit });
    return NextResponse.json(
      { items },
      {
        headers: {
          // 공개 활성 공지는 짧게 캐싱한다. 새 공지는 1분 이내에 반영.
          'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/announcements] query failed', error);
    return NextResponse.json({ error: '공지 조회에 실패했습니다.' }, { status: 500 });
  }
}

function isValidSeverity(value: string | null): value is AnnouncementSeverity {
  return value !== null && (announcementSeverityEnum as readonly string[]).includes(value);
}

function parseLimit(value: string | null): number {
  if (!value) return 20;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 20;
  return Math.max(1, Math.min(50, parsed));
}

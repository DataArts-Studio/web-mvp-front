import { and, asc, desc, gt, isNull, lte, or, sql } from 'drizzle-orm';

import { getDatabase } from '../client/drizzle';
import { type AnnouncementSeverity, announcements } from '../schema/announcements';

/**
 * 공지 한 건의 공개 필드. notification_reads / created_by 등 비공개 컬럼은 노출하지 않는다.
 */
export type PublicAnnouncement = {
  id: string;
  title: string;
  body: string;
  category: string;
  severity: AnnouncementSeverity;
  pinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
};

interface GetActiveOptions {
  /** severity 필터. 미지정 시 전체 */
  severity?: AnnouncementSeverity;
  /** 최대 반환 개수 */
  limit?: number;
}

/**
 * 활성 공지 목록을 최신순으로 반환한다.
 *
 * 활성 조건: `published_at <= now AND (expires_at IS NULL OR expires_at > now)`
 *
 * 정렬: pinned 우선, 그 다음 published_at 내림차순.
 *
 * RLS deny-all 정책 하에 service_role 로만 접근. 공개 라우트 핸들러에서 직접 호출한다.
 */
export async function getActiveAnnouncements(
  options: GetActiveOptions = {}
): Promise<PublicAnnouncement[]> {
  const db = getDatabase();
  const now = sql`now()`;

  const conditions = [
    lte(announcements.published_at, now),
    or(isNull(announcements.expires_at), gt(announcements.expires_at, now)),
  ];
  if (options.severity) {
    conditions.push(sql`${announcements.severity} = ${options.severity}`);
  }

  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      category: announcements.category,
      severity: announcements.severity,
      pinned: announcements.pinned,
      publishedAt: announcements.published_at,
      expiresAt: announcements.expires_at,
    })
    .from(announcements)
    .where(and(...conditions))
    .orderBy(desc(announcements.pinned), desc(announcements.published_at), asc(announcements.id))
    .limit(options.limit ?? 50);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    severity: row.severity,
    pinned: row.pinned,
    publishedAt: row.publishedAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  }));
}

/**
 * 현재 활성 critical 공지 중 가장 최근 1건을 반환한다. 없으면 null.
 * 상단 강제 노출 배너에서 사용.
 */
export async function getCriticalAnnouncement(): Promise<PublicAnnouncement | null> {
  const [first] = await getActiveAnnouncements({ severity: 'critical', limit: 1 });
  return first ?? null;
}

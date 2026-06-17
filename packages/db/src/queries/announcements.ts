import { and, asc, desc, eq, gt, isNull, lte, or, sql } from 'drizzle-orm';

import { getDatabase } from '../client/drizzle';
import { type AnnouncementSeverity, announcements } from '../schema/announcements';
import { notificationReads } from '../schema/announcements';

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

/**
 * 현재 활성이면서 `show_as_popup = true` 인 공지 중 가장 최근 1건을 반환한다. 없으면 null.
 * web 앱 첫 진입 팝업 모달에서 사용. severity 와 무관하게 popup 플래그로만 결정한다.
 */
export async function getActivePopupAnnouncement(): Promise<PublicAnnouncement | null> {
  const db = getDatabase();
  const now = sql`now()`;

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
    .where(
      and(
        eq(announcements.show_as_popup, true),
        lte(announcements.published_at, now),
        or(isNull(announcements.expires_at), gt(announcements.expires_at, now))
      )
    )
    .orderBy(desc(announcements.pinned), desc(announcements.published_at), asc(announcements.id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    severity: row.severity,
    pinned: row.pinned,
    publishedAt: row.publishedAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  };
}

/** 활성 공지 1건 + 해당 user 의 읽음 시각(없으면 null). */
export type AnnouncementWithReadState = PublicAnnouncement & {
  readAt: string | null;
};

/**
 * 사용자 단위 활성 공지 + 읽음 상태를 반환한다.
 *
 * - userId: 익명 쿠키 uuid 또는 (향후) 정식 계정 user_id
 * - notification_reads 와 LEFT JOIN 해서 본인 row 의 read_at 만 가져온다.
 *   다른 사용자의 읽음 기록은 노출하지 않는다.
 */
export async function getActiveAnnouncementsWithReadState(
  userId: string,
  options: GetActiveOptions = {}
): Promise<AnnouncementWithReadState[]> {
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
      readAt: notificationReads.read_at,
    })
    .from(announcements)
    .leftJoin(
      notificationReads,
      and(
        eq(notificationReads.announcement_id, announcements.id),
        eq(notificationReads.user_id, userId)
      )
    )
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
    readAt: row.readAt ? row.readAt.toISOString() : null,
  }));
}

/**
 * 사용자의 미읽음 활성 공지 수를 반환한다 (벨 아이콘 뱃지용).
 *
 * 활성 공지 중 notification_reads 매칭 row 가 없는 것을 카운트한다.
 */
export async function countUnreadAnnouncements(userId: string): Promise<number> {
  const db = getDatabase();
  const result = await db.execute(sql`
    SELECT COUNT(*) AS count
    FROM ${announcements} a
    LEFT JOIN ${notificationReads} r
      ON r.announcement_id = a.id AND r.user_id = ${userId}
    WHERE a.published_at <= now()
      AND (a.expires_at IS NULL OR a.expires_at > now())
      AND r.id IS NULL
  `);

  const row = result[0] as { count: string | number } | undefined;
  return Number(row?.count ?? 0);
}

/**
 * 공지를 읽음 처리한다. 동일 (user, announcement) 재요청은 멱등.
 *
 * `notification_reads_user_announcement_unq` 제약을 활용한 `ON CONFLICT DO NOTHING` 으로 처리.
 */
export async function markAnnouncementRead(userId: string, announcementId: string): Promise<void> {
  const db = getDatabase();
  await db
    .insert(notificationReads)
    .values({ user_id: userId, announcement_id: announcementId })
    .onConflictDoNothing({
      target: [notificationReads.user_id, notificationReads.announcement_id],
    });
}

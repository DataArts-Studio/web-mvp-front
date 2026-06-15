import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * 공지사항 카테고리.
 *
 * - feature: 신규 기능 안내
 * - maintenance: 점검 안내
 * - policy: 약관·정책 변경
 * - event: 이벤트·캠페인
 * - notice: 일반 안내
 */
export const announcementCategoryEnum = [
  'feature',
  'maintenance',
  'policy',
  'event',
  'notice',
] as const;
export type AnnouncementCategory = (typeof announcementCategoryEnum)[number];

/**
 * 공지사항 심각도.
 *
 * - info: 기본
 * - warning: 강조 (배경 톤만 변경)
 * - critical: 상단 배너 강제 노출
 */
export const announcementSeverityEnum = ['info', 'warning', 'critical'] as const;
export type AnnouncementSeverity = (typeof announcementSeverityEnum)[number];

/**
 * announcements: 운영팀이 전체 사용자에게 보내는 공지·점검·정책 안내.
 *
 * - 개인별 이벤트 알림(notifications, 별도 피처)과 데이터 모델이 분리됩니다.
 * - status 컬럼 없이 published_at / expires_at 으로 활성 여부를 계산합니다.
 *   활성 조건: published_at <= now < (expires_at OR infinity).
 * - severity = 'critical' 인 활성 공지는 상단 배너로 강제 노출됩니다.
 * - RLS: anon deny-all, 서버(service_role) 라우트에서만 접근.
 *   읽기 API 도 활성 공지만 반환하도록 서버에서 필터링.
 *
 * 자세한 명세: Notion FDD-NT01.
 */
export const announcements = pgTable(
  'announcements',
  (t) => ({
    id: t.uuid('id').primaryKey().defaultRandom(),
    title: t.text('title').notNull(),
    body: t.text('body').notNull(),
    category: t.varchar('category', { length: 20 }).$type<AnnouncementCategory>().notNull(),
    severity: t
      .varchar('severity', { length: 20 })
      .$type<AnnouncementSeverity>()
      .default('info')
      .notNull(),
    pinned: t.boolean('pinned').default(false).notNull(),
    /**
     * 팝업 노출 여부. true 이면 활성 기간 동안 web 앱에서 모달 팝업으로도 노출한다.
     * (상단 배너는 기존대로 severity='critical' 로 결정 — 둘은 독립적으로 조합 가능)
     * 사용자는 팝업을 id 단위로 닫을 수 있고, dismiss 상태는 localStorage 에 저장된다.
     */
    show_as_popup: t.boolean('show_as_popup').default(false).notNull(),
    published_at: t.timestamp('published_at', { withTimezone: true }).notNull(),
    expires_at: t.timestamp('expires_at', { withTimezone: true }),
    created_by: t.uuid('created_by'),
    created_at: t.timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: t.timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => ({
    // 활성 공지 조회: published_at <= now 정렬, pinned 우선
    activeIdx: index('announcements_active_idx').on(t.published_at, t.pinned),
    // 어드민 목록 검색·필터에서 자주 쓰는 카테고리 인덱스
    categoryIdx: index('announcements_category_idx').on(t.category),
  })
);

/**
 * notification_reads: 사용자별 공지 읽음 기록.
 *
 * - 동일 announcement_id 에 같은 user_id 가 중복 읽음 기록되지 않도록 UPSERT 처리.
 * - announcement 가 삭제되면 cascade 로 함께 정리됩니다.
 * - 향후 개인 알림(notifications) 피처가 도입되면 notification_id 컬럼이 사용됩니다.
 *   지금은 announcement 전용으로 사용.
 *
 * RLS: anon deny-all. 본인 user_id 행만 INSERT·SELECT 할 수 있도록 서버에서 처리.
 */
export const notificationReads = pgTable(
  'notification_reads',
  (t) => ({
    id: t.uuid('id').primaryKey().defaultRandom(),
    user_id: t.uuid('user_id').notNull(),
    announcement_id: t
      .uuid('announcement_id')
      .references(() => announcements.id, { onDelete: 'cascade' }),
    /**
     * 향후 개인 알림(notifications) 피처용 자리. 아직 사용 안 함.
     * announcement_id 와 동시에 NULL 이 아닌 케이스는 없도록 서버에서 강제.
     */
    notification_id: t.uuid('notification_id'),
    read_at: t.timestamp('read_at', { withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => ({
    userIdx: index('notification_reads_user_idx').on(t.user_id),
    announcementIdx: index('notification_reads_announcement_idx').on(t.announcement_id),
    // 동일 (user_id, announcement_id) 중복 기록 방지. ON CONFLICT DO NOTHING 으로 멱등 처리.
    userAnnouncementUnq: unique('notification_reads_user_announcement_unq').on(
      t.user_id,
      t.announcement_id
    ),
  })
);

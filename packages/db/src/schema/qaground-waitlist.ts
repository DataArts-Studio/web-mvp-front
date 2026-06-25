import { index, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * qaground_waitlist: qaground 비공개 베타 대기자(이메일) 명단.
 *
 * - 공개 랜딩 `/` 의 베타 신청 폼에서 수집한다. 서버 라우트(service_role) 경유로만 기록.
 * - RLS: anon/authenticated deny-all. 클라이언트 직접 접근 차단.
 * - email 은 라우트에서 소문자로 정규화해 저장하고 unique 로 중복 신청을 무시한다.
 * - source: 유입 출처(예: 'beta-landing'). 추후 분석용.
 * - `qaground_` 프리픽스: 향후 별도 프로젝트/DB 로 분리하기 쉽게 네임스페이스 분리.
 */
export const qagroundWaitlist = pgTable(
  'qaground_waitlist',
  (t) => ({
    id: t.uuid('id').primaryKey().defaultRandom(),
    email: t.text('email').notNull(),
    source: t.varchar('source', { length: 50 }),
    created_at: t.timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => ({
    emailUnique: uniqueIndex('qaground_waitlist_email_unique').on(t.email),
    createdIdx: index('qaground_waitlist_created_idx').on(t.created_at),
  })
);

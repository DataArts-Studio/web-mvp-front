import { index, pgTable } from 'drizzle-orm/pg-core';

/**
 * qaground_submissions: qaground 연습 챌린지에 사용자가 제출한 코드·답안과 채점 결과.
 *
 * - 로그인 없는 익명 수집. `anon_id`(클라 localStorage UUID)로 같은 브라우저의 제출을
 *   느슨하게 묶지만 개인정보는 담지 않는다(식별 불가).
 * - 서버 라우트(service_role 연결) 경유로만 기록. RLS anon/authenticated deny-all.
 * - 제출 종류(code/api/defect/testcase)마다 구조가 달라 `content`/`result`는 jsonb.
 * - `qaground_` 프리픽스: 향후 별도 프로젝트/DB 로 분리하기 쉽게 네임스페이스 분리.
 */
export const qagroundSubmissions = pgTable(
  'qaground_submissions',
  (t) => ({
    id: t.uuid('id').primaryKey().defaultRandom(),
    challenge_slug: t.text('challenge_slug').notNull(),
    track: t.varchar('track', { length: 20 }).notNull(),
    kind: t.varchar('kind', { length: 20 }).notNull(),
    content: t.jsonb('content').notNull(),
    result: t.jsonb('result'),
    anon_id: t.varchar('anon_id', { length: 64 }),
    created_at: t.timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  }),
  (t) => ({
    challengeIdx: index('qaground_submissions_challenge_idx').on(t.challenge_slug),
    createdIdx: index('qaground_submissions_created_idx').on(t.created_at),
  })
);

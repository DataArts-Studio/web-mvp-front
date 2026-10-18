import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * 레이트리밋·시도 제한 카운터. 서버리스 인스턴스마다 따로 세지 않도록 DB 에 둔다.
 * key 에는 용도와 대상(IP, 프로젝트)을 담고, 비밀번호 같은 입력 원문은 넣지 않는다.
 */
export const rateLimitBuckets = pgTable(
  'rate_limit_buckets',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull(),
    reset_at: timestamp('reset_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('rate_limit_buckets_reset_at_idx').on(t.reset_at)]
);

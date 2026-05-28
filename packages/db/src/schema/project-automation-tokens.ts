import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { projects } from './projects';

/**
 * project_automation_tokens: 프로젝트당 단일 자동화 토큰 (FDD-TR09 V1).
 *
 * - 한 프로젝트에 최대 1 row. CI 가 자동화 결과를 보낼 때 인증에 사용한다.
 * - 발급 시 평문은 한 번만 응답으로 노출, hash 만 저장.
 * - 회수 = row DELETE (V2 에서 다중 키·만료·scope 도입 시 별도 테이블 `api_keys` 로 이관 예정).
 * - RLS: anon deny-all 유지, 서버(service_role) 라우트만 접근.
 *
 * 자세한 명세: Notion FDD-TR09 V1 MVP 섹션.
 */
export const projectAutomationTokens = pgTable(
  'project_automation_tokens',
  {
    project_id: uuid('project_id')
      .primaryKey()
      .references(() => projects.id, { onDelete: 'cascade' }),
    /** 사용자 식별·표시용 prefix (예: `testea_pk_AbCd`). 본체는 노출하지 않음. */
    token_prefix: text('token_prefix').notNull(),
    /** 토큰 본체의 hash (argon2id 또는 bcrypt). 평문 미저장. */
    token_hash: text('token_hash').notNull(),
    last_used_at: timestamp('last_used_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // 자동화 결과 수신 인증의 핵심 경로(token_hash 동등 조회) 인덱스. 토큰 hash 는 전역 유일.
    tokenHashIdx: uniqueIndex('project_automation_tokens_token_hash_unq').on(t.token_hash),
  })
);

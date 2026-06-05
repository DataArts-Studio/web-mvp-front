import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { projects } from './projects';

/**
 * target_sites: 프로젝트가 자동 실행 대행(FDD-TR10)을 위해 등록하는 테스트 대상 환경.
 *
 * 고객은 케이스만 등록하고 실행은 Testea 가 소유하므로, 테스트 대상의 주소와
 * 로그인 인증·시크릿을 여기에 등록한다. 러너(#186)가 실행 시 이 row 를 복호화해
 * 대상 환경에 인증 정보를 주입한다.
 *
 * - 한 프로젝트가 여러 대상(스테이징/프로덕션 등)을 가질 수 있어 1:N.
 * - `auth_secret_encrypted`: 로그인 인증 정보 JSON 을 AES-256-GCM 으로 암호화한
 *   base64 ciphertext. 평문 저장 금지. nullable (인증이 필요 없는 공개 대상도 허용).
 *   암복호화는 `apps/web/src/shared/lib/crypto/encrypt.ts` 재사용.
 * - RLS: anon deny-all 유지(ENABLE + FORCE, 정책 없음). 서버(service_role) 라우트만 접근.
 *   시크릿을 담으므로 정책 누락은 곧 평문 노출 회귀.
 *
 * 자세한 명세: Notion FDD-TR10.
 */
export const targetSites = pgTable('target_sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  /** 대상 별칭 (예: "스테이징", "프로덕션"). 표시용. */
  name: text('name').notNull(),
  /** 테스트 대상 주소 (예: https://staging.example.com). 비밀 아님. */
  base_url: text('base_url').notNull(),
  /**
   * 로그인 인증 정보(JSON)를 AES-256-GCM 으로 암호화한 base64 문자열.
   * 평문 구조는 `TargetSiteAuthSecret` 참고 (username/password/headers/cookies 등 유연).
   * 인증 불필요 시 NULL.
   */
  auth_secret_encrypted: text('auth_secret_encrypted'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

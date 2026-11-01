import { pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

import { projects } from './projects';
import { targetSites } from './target-sites';
import { testCases } from './test-cases';

export const caseSpecStatusEnum = ['draft', 'approved'] as const;
export type CaseSpecStatus = (typeof caseSpecStatusEnum)[number];

/**
 * case_generated_specs: 자동 실행(FDD-TR10, #187)이 케이스별로 생성한 Playwright spec.
 *
 * 같은 케이스라도 대상 사이트마다 화면 구조가 다를 수 있어 (케이스, 대상) 당 1행이다.
 * - draft: LLM 이 생성한 초안. 승인 전까지는 실행할 때마다 새로 생성해 덮어쓴다.
 * - approved: 사람이 확인(필요하면 수정)하고 승인한 spec. 이후 실행은 생성 없이 이 spec 을 쓴다.
 *   승인된 spec 은 자동 생성이 덮어쓰지 않는다. 대상 앱의 실제 회귀를 LLM 이 코드를 고쳐
 *   가리는 일을 막기 위해서다.
 *
 * RLS: anon/authenticated deny-all (ENABLE + FORCE). 서버(postgres 롤)만 접근한다.
 */
export const caseGeneratedSpecs = pgTable(
  'case_generated_specs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    project_id: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    test_case_id: uuid('test_case_id')
      .notNull()
      .references(() => testCases.id, { onDelete: 'cascade' }),
    target_site_id: uuid('target_site_id')
      .notNull()
      .references(() => targetSites.id, { onDelete: 'cascade' }),
    /** 생성 시 캡처한 상대 경로. 비우면 대상 루트. */
    path: text('path'),
    spec: text('spec').notNull(),
    status: varchar('status', { length: 20 }).$type<CaseSpecStatus>().default('draft').notNull(),
    approved_at: timestamp('approved_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique('case_generated_specs_case_target_uniq').on(t.test_case_id, t.target_site_id)]
);

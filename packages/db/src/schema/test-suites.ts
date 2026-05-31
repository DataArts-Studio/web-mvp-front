import { sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { aiRequirementAnalyses } from './ai-requirement-analyses';
import { LifecycleStatus, projects } from './projects';
import { testScenarios } from './test-scenarios';

export const testSuites = pgTable(
  'test_suites',
  {
    id: uuid('id').primaryKey(),
    project_id: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: varchar('description'),
    /** AI 요구사항 분석에서 시나리오로 생성된 스위트의 출처. 일반 스위트는 NULL. */
    requirement_analysis_id: uuid('requirement_analysis_id').references(
      () => aiRequirementAnalyses.id,
      { onDelete: 'set null' }
    ),
    /** 이 스위트가 파생된 시나리오. 시나리오에서 만들지 않은 스위트는 NULL. */
    test_scenario_id: uuid('test_scenario_id').references(() => testScenarios.id, {
      onDelete: 'set null',
    }),
    sort_order: integer('sort_order'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    archived_at: timestamp('archived_at', { withTimezone: true }),
    lifecycle_status: varchar('lifecycle_status', { length: 20 })
      .$type<LifecycleStatus>()
      .default('ACTIVE')
      .notNull(),
  },
  (t) => ({
    /**
     * 한 시나리오당 ACTIVE 스위트는 1건만. 시나리오→스위트 파생의 중복 생성을 DB 레벨에서 차단.
     * 보관(DELETED) 스위트와 시나리오 출처가 없는(NULL) 스위트는 제약 대상에서 제외.
     */
    activeScenarioUnq: uniqueIndex('test_suites_active_scenario_unq')
      .on(t.test_scenario_id)
      .where(sql`${t.lifecycle_status} = 'ACTIVE' AND ${t.test_scenario_id} IS NOT NULL`),
  })
);

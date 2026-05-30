import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { aiRequirementAnalyses } from './ai-requirement-analyses';
import { LifecycleStatus, projects } from './projects';

export const scenarioTypeEnum = ['positive', 'negative', 'edge_case'] as const;
export type ScenarioType = (typeof scenarioTypeEnum)[number];

export const scenarioStatusEnum = ['DRAFT', 'REVIEW', 'CONFIRMED'] as const;
export type ScenarioStatus = (typeof scenarioStatusEnum)[number];

/**
 * 테스트 시나리오. AI 요구사항 분석에서 생성되거나 사용자가 직접 작성한 시나리오를
 * 1급 엔티티로 보관한다. requirement_analysis_id 로 출처(분석서)를 가리키며,
 * 여기서 파생된 test_suites 가 test_scenario_id 로 시나리오를 역참조한다.
 * 수동 작성 시 requirement_analysis_id 는 NULL.
 */
export const testScenarios = pgTable(
  'test_scenarios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    project_id: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    /** 출처 요구사항 분석서. 수동 작성 시 NULL. 분석서 삭제 시 시나리오는 보존(set null). */
    requirement_analysis_id: uuid('requirement_analysis_id').references(
      () => aiRequirementAnalyses.id,
      { onDelete: 'set null' }
    ),
    name: text('name').notNull(),
    description: text('description'),
    type: varchar('type', { length: 20 }).$type<ScenarioType>().default('positive').notNull(),
    /** 연관 기능 요구사항 id 참조 목록. */
    related_requirement_ids: jsonb('related_requirement_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
    /** 작성 상태: 초안 / 검토 / 확정. */
    status: varchar('status', { length: 20 }).$type<ScenarioStatus>().default('DRAFT').notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    lifecycle_status: varchar('lifecycle_status', { length: 20 })
      .$type<LifecycleStatus>()
      .default('ACTIVE')
      .notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // dev 는 pgEnum 대신 varchar+CHECK 채택(#150). ai_requirement_analyses 와 동일 방식.
    typeCheck: check(
      'test_scenarios_type_check',
      sql`${t.type} in ('positive', 'negative', 'edge_case')`
    ),
    statusCheck: check(
      'test_scenarios_status_check',
      sql`${t.status} in ('DRAFT', 'REVIEW', 'CONFIRMED')`
    ),
  })
);

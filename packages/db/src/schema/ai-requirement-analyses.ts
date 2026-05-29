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

import { type AiAttachedFileType } from './ai-usage-logs';
import { LifecycleStatus, projects } from './projects';

/**
 * AI 요구사항 분석 산출물. 사용자가 입력한 요구사항을 분석해 만든 요구사항 분석서와
 * 테스트 시나리오 원본을 통째로 보관한다. 이 분석서에서 파생된 test_suites 가
 * requirement_analysis_id 로 출처를 가리켜 역추적이 가능하다.
 */
export interface RequirementAnalysisDocument {
  title: string;
  summary: string;
  functionalRequirements: { id: string; title: string; description: string }[];
  nonFunctionalRequirements: { category: string; description: string }[];
  constraints: string[];
  assumptions: string[];
  openQuestions: string[];
  scenarios: {
    name: string;
    description: string;
    type?: 'positive' | 'negative' | 'edge_case';
    relatedRequirementIds?: string[];
  }[];
}

export const aiRequirementAnalyses = pgTable(
  'ai_requirement_analyses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    project_id: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    /** 사용자가 입력한 원본 요구사항 텍스트. */
    source_input: text('source_input').notNull(),
    /** 구조화된 분석 결과 + 생성된 시나리오 원본 전체. */
    analysis: jsonb('analysis').$type<RequirementAnalysisDocument>().notNull(),
    language: varchar('language', { length: 2 }).$type<'ko' | 'en'>().default('ko').notNull(),
    /** 첨부에서 생성된 경우 메타만 (본문 미저장, ai_usage_logs 패턴). 첨부 없으면 NULL. */
    attached_file_type: varchar('attached_file_type', { length: 20 }).$type<AiAttachedFileType>(),
    attached_file_char_count: integer('attached_file_char_count'),
    lifecycle_status: varchar('lifecycle_status', { length: 20 })
      .$type<LifecycleStatus>()
      .default('ACTIVE')
      .notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // dev 는 pgEnum 대신 varchar+CHECK 채택(#150). ai_usage_logs 와 동일 방식으로 강제.
    attachedFileTypeCheck: check(
      'ai_requirement_analyses_attached_file_type_check',
      sql`${t.attached_file_type} in ('pdf', 'markdown')`
    ),
  })
);

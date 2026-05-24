import { integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { projects } from './projects';

/**
 * 첨부 파일 타입 (FDD-TC11 V2). 첨부 없으면 NULL.
 * - pdf: PDF 파일 (라이브러리 파싱으로 텍스트 추출)
 * - markdown: Markdown 파일 (UTF-8 디코딩, 별도 파싱 없음)
 */
export const aiAttachedFileTypeEnum = ['pdf', 'markdown'] as const;
export type AiAttachedFileType = (typeof aiAttachedFileTypeEnum)[number];

export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  action_type: varchar('action_type', { length: 30 }).notNull(), // 'generate_cases'
  input_tokens: integer('input_tokens').default(0).notNull(),
  output_tokens: integer('output_tokens').default(0).notNull(),
  generated_count: integer('generated_count').default(0).notNull(),
  /**
   * 첨부 파일 메타 (FDD-TC11 V2). 첨부가 없는 V1 호출에서는 모두 NULL.
   * 본문은 저장하지 않고 사용량·디버깅 통계 목적의 메타만 보관.
   */
  attached_file_type: varchar('attached_file_type', { length: 20 }).$type<AiAttachedFileType>(),
  attached_file_size_bytes: integer('attached_file_size_bytes'),
  /** PDF 일 때만 채워짐. Markdown 은 NULL. */
  attached_file_page_count: integer('attached_file_page_count'),
  attached_file_char_count: integer('attached_file_char_count'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

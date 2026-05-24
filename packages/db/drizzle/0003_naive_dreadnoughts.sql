--
-- #132 FDD-TC11 V2 파일 첨부: ai_usage_logs 에 첨부 파일 메타 컬럼 4 종 추가
--
-- 컬럼:
--   attached_file_type        — 'pdf' | 'markdown' | NULL
--   attached_file_size_bytes  — 첨부 파일 원본 크기
--   attached_file_page_count  — PDF 일 때만 채움, MD 는 NULL
--   attached_file_char_count  — 추출된 텍스트 문자 수
--
-- 참고: drizzle-kit generate 가 함께 출력한 test_run_milestones CREATE TABLE 은
-- 스냅샷 드리프트로 발생한 가짜 diff (prod 에 이미 존재). 본 SQL 에는 V2 ALTER 만 남김.
-- idempotent: 동일 DB 에 두 번째 실행해도 에러 없이 통과한다.
--
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "attached_file_type" varchar(20);
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "attached_file_size_bytes" integer;
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "attached_file_page_count" integer;
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "attached_file_char_count" integer;

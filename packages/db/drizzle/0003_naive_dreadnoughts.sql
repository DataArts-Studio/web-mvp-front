--
-- #132 FDD-TC11 V2 파일 첨부: ai_usage_logs 에 첨부 파일 메타 컬럼 4 종 추가
--
-- 컬럼:
--   attached_file_type        — 'pdf' | 'markdown' | NULL
--   attached_file_size_bytes  — 첨부 파일 원본 크기
--   attached_file_page_count  — PDF 일 때만 채움, MD 는 NULL
--   attached_file_char_count  — 추출된 텍스트 문자 수
--
-- 참고: drizzle-kit generate 가 함께 출력한 test_run_milestones 정의는
-- prod 에 이미 존재해 가짜 diff 였지만, fresh DB / preview 환경엔 테이블이 없어
-- 0003 스냅샷만 믿고 후속 마이그레이션이 영구적으로 누락된다.
-- IF NOT EXISTS 로 prod 무해 + fresh DB 살림 양쪽을 동시에 충족시킨다.
-- idempotent: 동일 DB 에 두 번째 실행해도 에러 없이 통과한다.
--
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "attached_file_type" varchar(20);
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "attached_file_size_bytes" integer;
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "attached_file_page_count" integer;
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD COLUMN IF NOT EXISTS "attached_file_char_count" integer;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_run_milestones" (
  "test_run_id" uuid NOT NULL,
  "milestone_id" uuid NOT NULL,
  CONSTRAINT "test_run_milestones_test_run_id_milestone_id_pk" PRIMARY KEY ("test_run_id", "milestone_id")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "test_run_milestones"
    ADD CONSTRAINT "test_run_milestones_test_run_id_test_runs_id_fk"
    FOREIGN KEY ("test_run_id") REFERENCES "public"."test_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "test_run_milestones"
    ADD CONSTRAINT "test_run_milestones_milestone_id_milestones_id_fk"
    FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

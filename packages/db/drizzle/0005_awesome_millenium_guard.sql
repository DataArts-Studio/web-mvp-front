--
-- AI 요구사항 분석 산출물: ai_requirement_analyses 테이블 + test_suites.requirement_analysis_id FK
--
-- ai_attached_file_type enum 과 ai_usage_logs.attached_file_type 변환은 0004 에서 이미 처리됐다.
-- generate 가 0003 스냅샷 기준 diff 라 그 둘을 중복 출력했으나, 0004 가 enum 을 idempotent 하게
-- 보장하므로 여기서는 신규 테이블/컬럼/FK 만 추가한다. enum 존재만 한 번 더 방어한다.
-- idempotent: 동일 DB 에 두 번째 실행해도 에러 없이 통과한다.
--
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_attached_file_type') THEN
    CREATE TYPE "public"."ai_attached_file_type" AS ENUM ('pdf', 'markdown');
  END IF;
END$$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_requirement_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"source_input" text NOT NULL,
	"analysis" jsonb NOT NULL,
	"language" varchar(2) DEFAULT 'ko' NOT NULL,
	"attached_file_type" "ai_attached_file_type",
	"attached_file_char_count" integer,
	"lifecycle_status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "test_suites" ADD COLUMN IF NOT EXISTS "requirement_analysis_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ai_requirement_analyses"
    ADD CONSTRAINT "ai_requirement_analyses_project_id_projects_id_fk"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "test_suites"
    ADD CONSTRAINT "test_suites_requirement_analysis_id_ai_requirement_analyses_id_fk"
    FOREIGN KEY ("requirement_analysis_id") REFERENCES "public"."ai_requirement_analyses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

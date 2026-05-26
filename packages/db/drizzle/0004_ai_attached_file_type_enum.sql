--
-- #150 ai_usage_logs.attached_file_type 컬럼 pgEnum 적용
--
-- 기존 varchar(20) 컬럼을 pgEnum 으로 좁혀 DB 레벨에서 'pdf' / 'markdown' 만 허용한다.
-- 기존 row 의 값은 'pdf' / 'markdown' / NULL 만 존재해 변환 비용 없음.
-- CodeRabbit PR #133 리뷰 #5 분리.
--
-- idempotent: 동일 DB 에 두 번째 실행해도 에러 없이 통과한다.
--
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_attached_file_type') THEN
    CREATE TYPE "public"."ai_attached_file_type" AS ENUM ('pdf', 'markdown');
  END IF;
END$$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ai_usage_logs'
      AND column_name = 'attached_file_type'
      AND udt_name <> 'ai_attached_file_type'
  ) THEN
    ALTER TABLE "ai_usage_logs"
      ALTER COLUMN "attached_file_type" TYPE "public"."ai_attached_file_type"
      USING "attached_file_type"::"public"."ai_attached_file_type";
  END IF;
END$$;

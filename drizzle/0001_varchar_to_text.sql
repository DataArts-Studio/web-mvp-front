-- Migration: varchar → text 컬럼 타입 변경
-- 설명: 콘텐츠성 컬럼을 varchar에서 text로 변경하여 문자열 길이 초과 오류를 방지합니다.
-- PostgreSQL에서 ALTER TYPE varchar → text는 데이터 손실 없이 즉시 수행됩니다.

-- ============================================================
-- 1. test_cases: name, steps, pre_condition, expected_result
-- ============================================================
ALTER TABLE "test_cases" ALTER COLUMN "name" SET DATA TYPE text;
ALTER TABLE "test_cases" ALTER COLUMN "steps" SET DATA TYPE text;
ALTER TABLE "test_cases" ALTER COLUMN "pre_condition" SET DATA TYPE text;
ALTER TABLE "test_cases" ALTER COLUMN "expected_result" SET DATA TYPE text;
ALTER TABLE "test_cases" ALTER COLUMN "test_type" SET DATA TYPE varchar(50);
ALTER TABLE "test_cases" ALTER COLUMN "case_key" SET DATA TYPE varchar(20);

-- ============================================================
-- 2. test_suites: name, description
-- ============================================================
ALTER TABLE "test_suites" ALTER COLUMN "name" SET DATA TYPE text;
ALTER TABLE "test_suites" ALTER COLUMN "description" SET DATA TYPE text;

-- ============================================================
-- 3. test_case_versions: name
-- ============================================================
ALTER TABLE "test_case_versions" ALTER COLUMN "name" SET DATA TYPE text;
ALTER TABLE "test_case_versions" ALTER COLUMN "test_type" SET DATA TYPE varchar(50);

-- ============================================================
-- 4. test_runs: name, status
-- ============================================================
ALTER TABLE "test_runs" ALTER COLUMN "name" SET DATA TYPE text;
ALTER TABLE "test_runs" ALTER COLUMN "status" SET DATA TYPE varchar(20);

-- ============================================================
-- 5. test_case_runs: status, source_type
-- ============================================================
ALTER TABLE "test_case_runs" ALTER COLUMN "status" SET DATA TYPE varchar(20);
ALTER TABLE "test_case_runs" ALTER COLUMN "source_type" SET DATA TYPE varchar(20);

-- ============================================================
-- 6. test_case_templates: test_type
-- ============================================================
ALTER TABLE "test_case_templates" ALTER COLUMN "test_type" SET DATA TYPE varchar(50);

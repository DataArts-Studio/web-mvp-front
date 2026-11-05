-- 케이스 이름 중복 허용 (#372). 환경에 따라 제약 이름이 _key(초기 생성) 또는 _unique(drizzle 명명)로 다르므로 둘 다 처리한다.
ALTER TABLE "test_cases" DROP CONSTRAINT IF EXISTS "test_cases_project_id_name_key";--> statement-breakpoint
ALTER TABLE "test_cases" DROP CONSTRAINT IF EXISTS "test_cases_project_id_name_unique";

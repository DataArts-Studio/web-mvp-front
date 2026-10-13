-- 삭제(archived_at)된 섹션 이름을 다시 쓸 수 있도록, 이름 유니크를 활성 섹션으로 좁힌다 (#410).
-- 환경에 따라 제약 이름이 _key(초기 생성) 또는 _unique(drizzle 명명)로 다르므로 둘 다 처리한다.
ALTER TABLE "test_suite_sections" DROP CONSTRAINT IF EXISTS "test_suite_sections_suite_id_name_key";--> statement-breakpoint
ALTER TABLE "test_suite_sections" DROP CONSTRAINT IF EXISTS "test_suite_sections_suite_id_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "test_suite_sections_suite_id_name_active_unq" ON "test_suite_sections" USING btree ("suite_id","name") WHERE "test_suite_sections"."archived_at" IS NULL;

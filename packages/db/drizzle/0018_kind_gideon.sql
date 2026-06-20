ALTER TABLE "test_scenarios" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
-- 컬럼 추가 전에 삭제된 시나리오는 archived_at 이 NULL 이라 휴지통 잔여일/30일 자동정리에서 누락된다.
-- updated_at(마지막 삭제 시각 근사)으로 백필해 자동 정리 대상에 포함시킨다.
UPDATE "test_scenarios" SET "archived_at" = "updated_at" WHERE "lifecycle_status" = 'DELETED' AND "archived_at" IS NULL;
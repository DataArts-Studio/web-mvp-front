-- 기존 중복 정리: 한 시나리오에서 파생된 ACTIVE 스위트가 2건 이상이면(과거 중복 생성 버그 잔재)
-- 가장 오래된 1건만 ACTIVE로 남기고 나머지는 보관(DELETED) 처리한다.
-- 보관 처리이므로 휴지통에서 복구 가능하며, 아래 유니크 인덱스 생성이 기존 데이터로 실패하는 것을 방지한다.
UPDATE "test_suites" AS t
SET "lifecycle_status" = 'DELETED', "archived_at" = now(), "updated_at" = now()
WHERE t."test_scenario_id" IS NOT NULL
  AND t."lifecycle_status" = 'ACTIVE'
  AND t."id" <> (
    SELECT s."id"
    FROM "test_suites" AS s
    WHERE s."test_scenario_id" = t."test_scenario_id"
      AND s."lifecycle_status" = 'ACTIVE'
    ORDER BY s."created_at" ASC, s."id" ASC
    LIMIT 1
  );
--> statement-breakpoint
CREATE UNIQUE INDEX "test_suites_active_scenario_unq" ON "test_suites" USING btree ("test_scenario_id") WHERE "test_suites"."lifecycle_status" = 'ACTIVE' AND "test_suites"."test_scenario_id" IS NOT NULL;

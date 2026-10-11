-- 실행 생성이 연결 테이블(test_run_milestones)에만 마일스톤을 기록해 test_runs.milestone_id 가
-- 비어 있던 실행을 채운다 (#373). 마일스톤이 하나만 연결된 실행만 대상이며 여러 번 실행해도 안전하다.
UPDATE "test_runs" AS r
SET "milestone_id" = link."milestone_id"
FROM (
  SELECT "test_run_id", (array_agg("milestone_id"))[1] AS "milestone_id"
  FROM "test_run_milestones"
  GROUP BY "test_run_id"
  HAVING count(*) = 1
) AS link
WHERE r."id" = link."test_run_id"
  AND r."milestone_id" IS NULL;

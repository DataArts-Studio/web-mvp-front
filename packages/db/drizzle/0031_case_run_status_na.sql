-- 06k: 결과에 N/A(확인할 수 없음)를 더한다. 이 제약은 drizzle 밖에서 만들어져 있어 이름을 맞춰 다시 만든다.
ALTER TABLE "test_case_runs" DROP CONSTRAINT IF EXISTS "status_check";
ALTER TABLE "test_case_runs" ADD CONSTRAINT "status_check" CHECK ("test_case_runs"."status" in ('untested', 'pass', 'fail', 'blocked', 'na'));

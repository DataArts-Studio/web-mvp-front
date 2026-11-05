-- 06j: 골라 만든 재실행의 범위를 고정한 시각. 있으면 마일스톤·스위트에 케이스가 늘어도 실행에 채우지 않는다.
ALTER TABLE "test_runs" ADD COLUMN "scope_locked_at" timestamp with time zone;

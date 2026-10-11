-- #377: 휴지통에 있는 케이스를 완료되지 않은 실행에서 제외한다.
-- 제외 시각을 케이스의 archived_at(UTC)과 같게 남겨, 케이스를 복원하면 앱이 이 행만 되돌린다.
UPDATE test_case_runs AS tcr
SET excluded_at = (tc.archived_at AT TIME ZONE 'UTC'),
    updated_at = now()
FROM test_cases AS tc, test_runs AS tr
WHERE tcr.test_case_id = tc.id
  AND tcr.test_run_id = tr.id
  AND tc.lifecycle_status <> 'ACTIVE'
  AND tc.archived_at IS NOT NULL
  AND tcr.excluded_at IS NULL
  AND tr.status <> 'COMPLETED';
--> statement-breakpoint
-- #376: 범위 변경 뒤 다시 계산되지 않았던 실행 상태를 제외되지 않은 케이스 결과로 맞춘다.
UPDATE test_runs AS tr
SET status = s.new_status,
    updated_at = now()
FROM (
  SELECT r.id,
    CASE
      WHEN count(c.id) = 0 OR count(c.id) FILTER (WHERE c.status = 'untested') = count(c.id)
        THEN 'NOT_STARTED'
      WHEN count(c.id) FILTER (WHERE c.status = 'untested') = 0 THEN 'COMPLETED'
      ELSE 'IN_PROGRESS'
    END AS new_status
  FROM test_runs AS r
  LEFT JOIN test_case_runs AS c ON c.test_run_id = r.id AND c.excluded_at IS NULL
  GROUP BY r.id
) AS s
WHERE tr.id = s.id
  AND tr.status <> s.new_status;

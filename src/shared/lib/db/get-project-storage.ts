import { sql } from 'drizzle-orm';
import { getDatabase } from './drizzle';

/**
 * 프로젝트에 속한 모든 테이블의 데이터 크기를 합산하여 바이트 단위로 반환합니다.
 * PostgreSQL의 pg_column_size()를 사용합니다.
 */
export async function getProjectStorageBytes(projectId: string): Promise<number> {
  const db = getDatabase();

  const result = await db.execute(sql`
    SELECT COALESCE(SUM(size), 0) AS total FROM (
      SELECT SUM(pg_column_size(t.*)) AS size FROM test_cases t WHERE t.project_id = ${projectId}
      UNION ALL
      SELECT SUM(pg_column_size(t.*)) AS size FROM test_suites t WHERE t.project_id = ${projectId}
      UNION ALL
      SELECT SUM(pg_column_size(t.*)) AS size FROM test_runs t WHERE t.project_id = ${projectId}
      UNION ALL
      SELECT SUM(pg_column_size(t.*)) AS size FROM milestones t WHERE t.project_id = ${projectId}
      UNION ALL
      SELECT SUM(pg_column_size(tcr.*)) AS size FROM test_case_runs tcr
        WHERE tcr.test_run_id IN (SELECT id FROM test_runs WHERE project_id = ${projectId})
      UNION ALL
      SELECT SUM(pg_column_size(trs.*)) AS size FROM test_run_suites trs
        WHERE trs.test_run_id IN (SELECT id FROM test_runs WHERE project_id = ${projectId})
      UNION ALL
      SELECT SUM(pg_column_size(stc.*)) AS size FROM suite_test_cases stc
        WHERE stc.suite_id IN (SELECT id FROM test_suites WHERE project_id = ${projectId})
      UNION ALL
      SELECT SUM(pg_column_size(mtc.*)) AS size FROM milestone_test_cases mtc
        WHERE mtc.milestone_id IN (SELECT id FROM milestones WHERE project_id = ${projectId})
      UNION ALL
      SELECT SUM(pg_column_size(mts.*)) AS size FROM milestone_test_suites mts
        WHERE mts.milestone_id IN (SELECT id FROM milestones WHERE project_id = ${projectId})
      UNION ALL
      SELECT SUM(pg_column_size(pp.*)) AS size FROM project_preferences pp WHERE pp.project_id = ${projectId}
    ) sub
  `);

  const row = result[0] as { total: string | number } | undefined;
  return Number(row?.total ?? 0);
}

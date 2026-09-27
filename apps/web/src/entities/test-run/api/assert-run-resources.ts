import { getDatabase, milestones, testCases, testSuites } from '@testea/db';
import { inArray } from 'drizzle-orm';
import 'server-only';

type Transaction = Parameters<Parameters<ReturnType<typeof getDatabase>['transaction']>[0]>[0];

/** 연결 대상 전체를 확인한 뒤에만 실행 데이터를 기록한다. */
export async function assertRunResources(
  tx: Transaction,
  projectId: string,
  resources: { milestoneIds?: string[]; suiteIds?: string[]; caseIds?: string[] }
) {
  const groups = [
    [milestones, resources.milestoneIds],
    [testSuites, resources.suiteIds],
    [testCases, resources.caseIds],
  ] as const;

  for (const [table, inputIds] of groups) {
    const ids = [...new Set(inputIds ?? [])];
    if (ids.length === 0) continue;
    const rows = await tx
      .select({ id: table.id, projectId: table.project_id })
      .from(table)
      .where(inArray(table.id, ids));
    const ownedIds = new Set(
      rows.filter((row) => row.projectId === projectId).map((row) => row.id)
    );
    if (ids.some((id) => !ownedIds.has(id))) {
      throw new Error('실행에 연결할 리소스의 프로젝트가 일치하지 않습니다.');
    }
  }
}

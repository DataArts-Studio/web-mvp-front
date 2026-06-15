import {
  type TestCaseRunResultSource,
  type TestCaseRunStatus,
  type TestRunStatus,
  getDatabase,
  testCaseRuns,
  testCases,
  testRuns,
} from '@testea/db';
import { and, eq, isNull } from 'drizzle-orm';
import 'server-only';

/**
 * 자동 실행 결과를 TR09 방식으로 Run 에 기록한다.
 *
 * auto-results 라우트(app/api/.../auto-results/route.ts)와 동일한 정책:
 * - 사용자가 미리 만든 Run 안의, 해당 case_key 를 가진 test_case_run 만 UPDATE.
 * - result_source='auto', status, automation_meta, executed_at 설정.
 * - 새 case_run 자동 생성 안 함(매칭 없으면 기록 실패로 반환).
 * - 기록 후 Run 상태(untested 개수 기반) 재계산.
 *
 * 서버액션이 호출하는 단건 버전. 라우트는 토큰 인증·배치라 별도 유지한다.
 */

export interface RecordAutoResultInput {
  runId: string;
  caseKey: string;
  status: TestCaseRunStatus;
  comment?: string | null;
  durationMs?: number;
  errorMessage?: string;
  meta?: { branch?: string; sha?: string; url?: string };
}

export interface RecordAutoResultOutcome {
  /** case_key 가 Run 안의 case_run 과 매칭되어 기록됐는지. */
  matched: boolean;
}

export async function recordAutoResult(
  input: RecordAutoResultInput
): Promise<RecordAutoResultOutcome> {
  const db = getDatabase();

  // Run 안에서 해당 case_key 의 case_run 찾기 (논리 삭제 제외).
  const [target] = await db
    .select({ caseRunId: testCaseRuns.id, caseKey: testCases.case_key })
    .from(testCaseRuns)
    .innerJoin(testCases, eq(testCaseRuns.test_case_id, testCases.id))
    .where(
      and(
        eq(testCaseRuns.test_run_id, input.runId),
        eq(testCases.case_key, input.caseKey),
        isNull(testCaseRuns.excluded_at)
      )
    )
    .limit(1);

  if (!target) {
    return { matched: false };
  }

  const automationMeta: Record<string, unknown> = {};
  if (input.meta?.branch) automationMeta.branch = input.meta.branch;
  if (input.meta?.sha) automationMeta.sha = input.meta.sha;
  if (input.meta?.url) automationMeta.url = input.meta.url;
  if (typeof input.durationMs === 'number') automationMeta.durationMs = input.durationMs;
  if (input.errorMessage) automationMeta.errorMessage = input.errorMessage;

  const now = new Date();
  await db
    .update(testCaseRuns)
    .set({
      status: input.status satisfies TestCaseRunStatus,
      comment: input.comment ?? input.errorMessage ?? null,
      executed_at: input.status !== 'untested' ? now : null,
      result_source: 'auto' satisfies TestCaseRunResultSource,
      automation_meta: Object.keys(automationMeta).length ? automationMeta : null,
      updated_at: now,
    })
    .where(eq(testCaseRuns.id, target.caseRunId));

  await recalcRunStatus(db, input.runId);

  return { matched: true };
}

/** Run 상태 재계산 (auto-results route 와 동일 로직). */
async function recalcRunStatus(db: ReturnType<typeof getDatabase>, testRunId: string) {
  const rows = await db
    .select({ status: testCaseRuns.status })
    .from(testCaseRuns)
    .where(and(eq(testCaseRuns.test_run_id, testRunId), isNull(testCaseRuns.excluded_at)));

  if (rows.length === 0) return;

  const untested = rows.filter((r) => r.status === 'untested').length;
  const total = rows.length;

  let next: TestRunStatus;
  if (untested === total) next = 'NOT_STARTED';
  else if (untested === 0) next = 'COMPLETED';
  else next = 'IN_PROGRESS';

  await db
    .update(testRuns)
    .set({ status: next, updated_at: new Date() })
    .where(eq(testRuns.id, testRunId));
}

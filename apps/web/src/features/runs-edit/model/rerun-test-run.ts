'use server';

import { requireProjectAccess } from '@/access/lib/require-access';
import * as Sentry from '@sentry/nextjs';
import {
  type TestCaseRunSourceType,
  getDatabase,
  testCaseRuns,
  testCases,
  testRunMilestones,
  testRunSuites,
  testRuns,
} from '@testea/db';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

type RerunTestRunSuccess = {
  success: true;
  testRun: typeof testRuns.$inferSelect;
};

type RerunTestRunFailure = {
  success: false;
  error: string;
};

export type RerunTestRunResult = RerunTestRunSuccess | RerunTestRunFailure;

/**
 * 회귀 반복 실행 유도 (FDD-TR12): 원본 Run 을 동일 구성으로 다시 실행하는 새 Run 을 만든다.
 *
 * - 원본 `test_case_runs` 중 `excluded_at IS NULL` 인 행의 케이스 셋을 복제하되,
 *   현재 활성(lifecycle ACTIVE, archived_at IS NULL) 케이스만 시드한다.
 * - 원본의 결과(status/comment/executed_at)는 복사하지 않는다. 모두 `untested` 로 초기화.
 * - `test_run_suites` / `test_run_milestones` 링크도 원본 구성대로 복제 (excluded_at 배제).
 * - 전체를 트랜잭션으로 처리해 부분 생성 행을 남기지 않는다. 모든 INSERT 는 returning().
 */
export async function rerunTestRunAction(runId: string): Promise<RerunTestRunResult> {
  const db = getDatabase();

  // 1. 원본 Run 조회 + project_id 기반 접근 권한 확인
  const [sourceRun] = await db.select().from(testRuns).where(eq(testRuns.id, runId)).limit(1);

  if (!sourceRun) {
    return { success: false, error: '원본 테스트 실행을 찾을 수 없습니다.' };
  }
  if (!sourceRun.project_id || !(await requireProjectAccess(sourceRun.project_id))) {
    return { success: false, error: '접근 권한이 없습니다.' };
  }

  const projectId = sourceRun.project_id;

  try {
    // 2. 원본 케이스 셋 조회 (excluded_at IS NULL 만)
    const sourceCaseRunRows = await db
      .select({
        test_case_id: testCaseRuns.test_case_id,
        source_type: testCaseRuns.source_type,
        source_id: testCaseRuns.source_id,
      })
      .from(testCaseRuns)
      .where(and(eq(testCaseRuns.test_run_id, runId), isNull(testCaseRuns.excluded_at)));

    if (sourceCaseRunRows.length === 0) {
      return {
        success: false,
        error: '원본 실행에 다시 실행할 케이스가 없습니다.',
      };
    }

    // 3. 현재 활성 케이스만 필터링 (삭제/아카이브된 케이스 제외)
    const candidateCaseIds = [
      ...new Set(sourceCaseRunRows.map((r) => r.test_case_id).filter(Boolean)),
    ] as string[];

    const activeCaseRows =
      candidateCaseIds.length > 0
        ? await db
            .select({ id: testCases.id })
            .from(testCases)
            .where(
              and(
                inArray(testCases.id, candidateCaseIds),
                eq(testCases.lifecycle_status, 'ACTIVE'),
                isNull(testCases.archived_at)
              )
            )
        : [];

    const activeCaseIds = new Set(activeCaseRows.map((r) => r.id));

    // 원본 행 순서를 유지하며 활성 케이스만, 첫 source(type/id) 기준으로 중복 제거
    const seededCases: Array<{
      test_case_id: string;
      source_type: TestCaseRunSourceType;
      source_id: string | null;
    }> = [];
    const seenCaseIds = new Set<string>();
    for (const row of sourceCaseRunRows) {
      if (!row.test_case_id) continue;
      if (!activeCaseIds.has(row.test_case_id)) continue;
      if (seenCaseIds.has(row.test_case_id)) continue;
      seenCaseIds.add(row.test_case_id);
      seededCases.push({
        test_case_id: row.test_case_id,
        source_type: row.source_type,
        source_id: row.source_id,
      });
    }

    if (seededCases.length === 0) {
      return {
        success: false,
        error: '원본 케이스가 모두 삭제/아카이브되어 다시 실행할 수 없습니다.',
      };
    }

    // 4. 원본 구성(스위트/마일스톤 링크) 조회 (excluded_at 배제)
    const [sourceSuiteLinks, sourceMilestoneLinks] = await Promise.all([
      db
        .select({ test_suite_id: testRunSuites.test_suite_id })
        .from(testRunSuites)
        .where(and(eq(testRunSuites.test_run_id, runId), isNull(testRunSuites.excluded_at))),
      db
        .select({ milestone_id: testRunMilestones.milestone_id })
        .from(testRunMilestones)
        .where(eq(testRunMilestones.test_run_id, runId)),
    ]);

    const suiteIds = [
      ...new Set(sourceSuiteLinks.map((r) => r.test_suite_id).filter(Boolean)),
    ] as string[];
    const milestoneIds = [
      ...new Set(sourceMilestoneLinks.map((r) => r.milestone_id).filter(Boolean)),
    ] as string[];

    // 5. 자동 제안 이름: 회귀 재실행 - {원본명} ({YYYY-MM-DD})
    const now = new Date();
    const dateLabel = formatDate(now);
    const proposedName = `회귀 재실행 - ${sourceRun.name} (${dateLabel})`;

    const newTestRun = await db.transaction(async (tx) => {
      // 5-1. 새 Run 생성 (status=NOT_STARTED, milestone_id 는 원본 따라감)
      const [run] = await tx
        .insert(testRuns)
        .values({
          project_id: projectId,
          milestone_id: sourceRun.milestone_id,
          name: proposedName,
          status: 'NOT_STARTED',
        })
        .returning();

      if (!run) {
        throw new Error('새 테스트 실행 생성에 실패했습니다.');
      }

      // 5-2. 마일스톤 링크 복제
      if (milestoneIds.length > 0) {
        await tx
          .insert(testRunMilestones)
          .values(
            milestoneIds.map((milestoneId) => ({
              test_run_id: run.id,
              milestone_id: milestoneId,
            }))
          )
          .onConflictDoNothing()
          .returning();
      }

      // 5-3. 스위트 링크 복제
      if (suiteIds.length > 0) {
        await tx
          .insert(testRunSuites)
          .values(
            suiteIds.map((suiteId) => ({
              test_run_id: run.id,
              test_suite_id: suiteId,
            }))
          )
          .onConflictDoNothing()
          .returning();
      }

      // 5-4. 케이스 시드 (status=untested, executed_at=null, 결과 미복사)
      const newCaseRuns = seededCases.map((c) => ({
        id: uuidv7(),
        test_run_id: run.id,
        test_case_id: c.test_case_id,
        status: 'untested' as const,
        executed_at: null,
        source_type: c.source_type,
        source_id: c.source_id,
        created_at: now,
        updated_at: now,
      }));

      const insertedCaseRuns = await tx.insert(testCaseRuns).values(newCaseRuns).returning();

      if (insertedCaseRuns.length === 0) {
        throw new Error('케이스 시드에 실패했습니다.');
      }

      return run;
    });

    return { success: true, testRun: newTestRun };
  } catch (error) {
    console.error('[rerunTestRunAction] Error:', error);
    Sentry.captureException(error, {
      extra: { action: 'rerunTestRunAction', runId, project_id: projectId },
    });
    return { success: false, error: '회귀 재실행 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' };
  }
}

/** 서버 now 기준 YYYY-MM-DD 포맷 (자동 제안 이름용) */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

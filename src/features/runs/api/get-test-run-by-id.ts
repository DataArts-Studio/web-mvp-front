'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testRuns, testCaseRuns, testCases, testSuites, testRunSuites, milestones, milestoneTestSuites, milestoneTestCases, TestRunStatus, TestCaseRunStatus, TestCaseRunSourceType } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import type { TestCaseRunDetail, SourceInfo, TestRunDetail } from '@/entities/test-run';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

/**
 * Read-repair: 테스트 실행 조회 시 마일스톤에 연결된 스위트/케이스 중
 * 누락된 test_run_suites, test_case_runs를 자동으로 백필합니다.
 */
async function repairTestRun(db: ReturnType<typeof getDatabase>, runId: string, milestoneId: string) {
  // 1. 마일스톤에 연결된 모든 스위트
  const msSuites = await db
    .select({ test_suite_id: milestoneTestSuites.test_suite_id })
    .from(milestoneTestSuites)
    .where(eq(milestoneTestSuites.milestone_id, milestoneId));

  const suiteIds = msSuites.map((s) => s.test_suite_id).filter(Boolean) as string[];

  if (suiteIds.length > 0) {
    // 2. test_run_suites 누락분 생성 (제외된 스위트는 복원하지 않음)
    const existingRunSuites = await db
      .select({ test_suite_id: testRunSuites.test_suite_id, excluded_at: testRunSuites.excluded_at })
      .from(testRunSuites)
      .where(eq(testRunSuites.test_run_id, runId));

    const existingSuiteIds = new Set(existingRunSuites.map((s) => s.test_suite_id));
    const excludedSuiteIds = new Set(existingRunSuites.filter((s) => s.excluded_at).map((s) => s.test_suite_id));
    const missingSuiteIds = suiteIds.filter((id) => !existingSuiteIds.has(id));

    if (missingSuiteIds.length > 0) {
      await db.insert(testRunSuites).values(
        missingSuiteIds.map((suiteId) => ({ test_run_id: runId, test_suite_id: suiteId }))
      ).onConflictDoNothing();
    }

    // 3. 스위트 케이스 중 누락된 test_case_runs 생성 (제외된 스위트 건너뜀)
    const activeSuiteIds = suiteIds.filter((id) => !excludedSuiteIds.has(id));
    const suiteCaseRows = activeSuiteIds.length > 0
      ? await db
          .select({ id: testCases.id, test_suite_id: testCases.test_suite_id })
          .from(testCases)
          .where(and(inArray(testCases.test_suite_id, activeSuiteIds), eq(testCases.lifecycle_status, 'ACTIVE')))
      : [];

    if (suiteCaseRows.length > 0) {
      const caseIds = suiteCaseRows.map((r) => r.id).filter(Boolean) as string[];

      const existingCaseRuns = await db
        .select({ test_case_id: testCaseRuns.test_case_id })
        .from(testCaseRuns)
        .where(and(eq(testCaseRuns.test_run_id, runId), inArray(testCaseRuns.test_case_id, caseIds)));

      const existingCaseIds = new Set(existingCaseRuns.map((r) => r.test_case_id));
      const missingCases = suiteCaseRows.filter((r) => r.id && !existingCaseIds.has(r.id));

      if (missingCases.length > 0) {
        await db.insert(testCaseRuns).values(
          missingCases.map((c) => ({
            id: uuidv7(),
            test_run_id: runId,
            test_case_id: c.id,
            status: 'untested' as const,
            source_type: 'suite' as const,
            source_id: c.test_suite_id,
            created_at: new Date(),
            updated_at: new Date(),
          }))
        );
      }
    }
  }

  // 4. 마일스톤 직접 연결 케이스 누락분 생성
  const msCases = await db
    .select({ test_case_id: milestoneTestCases.test_case_id })
    .from(milestoneTestCases)
    .where(eq(milestoneTestCases.milestone_id, milestoneId));

  const msCaseIds = msCases.map((c) => c.test_case_id).filter(Boolean) as string[];

  if (msCaseIds.length > 0) {
    const existingMsCaseRuns = await db
      .select({ test_case_id: testCaseRuns.test_case_id })
      .from(testCaseRuns)
      .where(and(eq(testCaseRuns.test_run_id, runId), inArray(testCaseRuns.test_case_id, msCaseIds)));

    const existingMsCaseIds = new Set(existingMsCaseRuns.map((r) => r.test_case_id));
    const missingMsCaseIds = msCaseIds.filter((id) => !existingMsCaseIds.has(id));

    if (missingMsCaseIds.length > 0) {
      await db.insert(testCaseRuns).values(
        missingMsCaseIds.map((caseId) => ({
          id: uuidv7(),
          test_run_id: runId,
          test_case_id: caseId,
          status: 'untested' as const,
          source_type: 'milestone' as const,
          source_id: milestoneId,
          created_at: new Date(),
          updated_at: new Date(),
        }))
      );
    }
  }
}

export async function getTestRunById(testRunId: string): Promise<ActionResult<TestRunDetail>> {
  try {
    const db = getDatabase();

    // 1. 테스트 실행 기본 정보
    const [run] = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.id, testRunId));

    if (!run) {
      return { success: false, errors: { _general: ['테스트 실행을 찾을 수 없습니다.'] } };
    }

    // Read-repair: 마일스톤 기반 테스트 실행의 누락 케이스 자동 백필
    if (run.milestone_id) {
      try {
        await repairTestRun(db, testRunId, run.milestone_id);
      } catch (repairError) {
        console.error('repairTestRun failed:', repairError);
      }
    }

    // 2. 테스트 케이스 실행 결과 (논리 삭제 제외)
    const caseRuns = await db
      .select()
      .from(testCaseRuns)
      .where(and(eq(testCaseRuns.test_run_id, testRunId), isNull(testCaseRuns.excluded_at)));

    // 3. 테스트 케이스 정보
    const caseIds = [...new Set(caseRuns.map(cr => cr.test_case_id).filter(Boolean))] as string[];
    const cases = caseIds.length > 0
      ? await db.select().from(testCases).where(inArray(testCases.id, caseIds))
      : [];
    const caseMap = new Map(cases.map(c => [c.id, c]));

    // 4. 테스트 실행-스위트 연결 (논리 삭제 제외)
    const runSuiteRows = await db
      .select()
      .from(testRunSuites)
      .where(and(eq(testRunSuites.test_run_id, testRunId), isNull(testRunSuites.excluded_at)));

    const suiteIds = [...new Set(runSuiteRows.map(rs => rs.test_suite_id).filter(Boolean))] as string[];
    const suiteRows = suiteIds.length > 0
      ? await db.select({ id: testSuites.id, name: testSuites.name }).from(testSuites).where(inArray(testSuites.id, suiteIds))
      : [];
    const suiteMap = new Map(suiteRows.map(s => [s.id, s.name]));

    // 5. 마일스톤 정보
    let milestoneInfo: { id: string; name: string } | null = null;
    if (run.milestone_id) {
      const [m] = await db
        .select({ id: milestones.id, name: milestones.name })
        .from(milestones)
        .where(eq(milestones.id, run.milestone_id));
      if (m) milestoneInfo = m;
    }

    // 6. 테스트 케이스의 스위트 이름 조회
    const allSuiteIds = [...new Set(cases.map(c => c.test_suite_id).filter(Boolean))] as string[];
    const extraSuiteIds = allSuiteIds.filter(id => !suiteMap.has(id));
    if (extraSuiteIds.length > 0) {
      const extraSuites = await db.select({ id: testSuites.id, name: testSuites.name }).from(testSuites).where(inArray(testSuites.id, extraSuiteIds));
      for (const s of extraSuites) suiteMap.set(s.id, s.name);
    }

    // Source 정보 구성
    const sourceIdToName = new Map<string, string>();
    const sources: SourceInfo[] = [];
    const hasSuites = runSuiteRows.length > 0;
    const hasMilestone = !!milestoneInfo;

    if (hasSuites) {
      for (const s of suiteRows) {
        sourceIdToName.set(s.id, s.name);
        sources.push({ id: s.id, name: s.name, type: 'suite' });
      }
    }
    if (hasMilestone) {
      sourceIdToName.set(milestoneInfo!.id, milestoneInfo!.name);
      sources.push({ id: milestoneInfo!.id, name: milestoneInfo!.name, type: 'milestone' });
    }

    let sourceType: TestRunDetail['sourceType'] = 'ADHOC';
    const sourceNameParts: string[] = [];

    if (hasSuites) {
      sourceType = 'SUITE';
      const suiteNames = suiteRows.map(s => s.name).filter(Boolean);
      if (suiteNames.length > 0) sourceNameParts.push(`스위트: ${suiteNames.join(', ')}`);
    }
    if (hasMilestone) {
      sourceType = hasSuites ? 'SUITE' : 'MILESTONE';
      sourceNameParts.push(`마일스톤: ${milestoneInfo!.name}`);
    }
    const sourceName = sourceNameParts.length > 0 ? sourceNameParts.join(' | ') : '직접 선택한 케이스';

    // 테스트 케이스 실행 상세
    const testCaseRunDetails: TestCaseRunDetail[] = caseRuns.map(tcr => {
      const tc = tcr.test_case_id ? caseMap.get(tcr.test_case_id) : undefined;
      return {
        id: tcr.id,
        testCaseId: tcr.test_case_id || '',
        code: tc?.display_id
          ? `TC-${String(tc.display_id).padStart(3, '0')}`
          : tc?.case_key || '',
        title: tc?.name || '',
        status: tcr.status,
        comment: tcr.comment,
        executedAt: tcr.executed_at,
        sourceType: (tcr.source_type as TestCaseRunSourceType) || 'adhoc',
        sourceId: tcr.source_id || null,
        sourceName: tcr.source_id ? (sourceIdToName.get(tcr.source_id) || null) : null,
        testSuiteId: tc?.test_suite_id || null,
        testSuiteName: tc?.test_suite_id ? (suiteMap.get(tc.test_suite_id) || null) : null,
        preCondition: tc?.pre_condition || null,
        steps: tc?.steps || null,
        expectedResult: tc?.expected_result || null,
      };
    });

    // Stats
    const total = testCaseRunDetails.length;
    const untested = testCaseRunDetails.filter(tc => tc.status === 'untested').length;
    const pass = testCaseRunDetails.filter(tc => tc.status === 'pass').length;
    const fail = testCaseRunDetails.filter(tc => tc.status === 'fail').length;
    const blocked = testCaseRunDetails.filter(tc => tc.status === 'blocked').length;
    const completed = pass + fail + blocked;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const result: TestRunDetail = {
      id: run.id,
      name: run.name,
      description: run.description,
      status: run.status,
      sourceType,
      sourceName,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      shareToken: run.share_token ?? null,
      shareExpiresAt: run.share_expires_at ?? null,
      testCaseRuns: testCaseRunDetails,
      sources,
      stats: { total, untested, pass, fail, blocked, progressPercent },
    };

    return { success: true, data: result };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getTestRunById' } });
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: { _general: [`테스트 실행을 불러오는 중 오류가 발생했습니다: ${errorMessage}`] },
    };
  }
}

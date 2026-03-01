'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testRuns, testCaseRuns, testCases, testSuites, testRunSuites, milestoneTestSuites, milestoneTestCases, TestRunStatus, TestCaseRunStatus, TestCaseRunSourceType } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { eq, and, inArray } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

export interface TestCaseRunDetail {
  id: string;
  testCaseId: string;
  code: string;
  title: string;
  status: TestCaseRunStatus;
  comment: string | null;
  executedAt: Date | null;
  sourceType: TestCaseRunSourceType;
  sourceId: string | null;
  sourceName: string | null;
  testSuiteId: string | null;
  testSuiteName: string | null;
}

export interface SourceInfo {
  id: string;
  name: string;
  type: 'suite' | 'milestone';
}

export interface TestRunDetail {
  id: string;
  name: string;
  description: string | null;
  status: TestRunStatus;
  sourceType: 'SUITE' | 'MILESTONE' | 'ADHOC';
  sourceName: string;
  createdAt: Date;
  updatedAt: Date;
  testCaseRuns: TestCaseRunDetail[];
  sources: SourceInfo[];
  stats: {
    total: number;
    untested: number;
    pass: number;
    fail: number;
    blocked: number;
    progressPercent: number;
  };
}

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
    // 2. test_run_suites 누락분 생성
    const existingRunSuites = await db
      .select({ test_suite_id: testRunSuites.test_suite_id })
      .from(testRunSuites)
      .where(eq(testRunSuites.test_run_id, runId));

    const existingSuiteIds = new Set(existingRunSuites.map((s) => s.test_suite_id));
    const missingSuiteIds = suiteIds.filter((id) => !existingSuiteIds.has(id));

    if (missingSuiteIds.length > 0) {
      await db.insert(testRunSuites).values(
        missingSuiteIds.map((suiteId) => ({ test_run_id: runId, test_suite_id: suiteId }))
      ).onConflictDoNothing();
    }

    // 3. 스위트 케이스 중 누락된 test_case_runs 생성
    const suiteCaseRows = await db
      .select({ id: testCases.id, test_suite_id: testCases.test_suite_id })
      .from(testCases)
      .where(and(inArray(testCases.test_suite_id, suiteIds), eq(testCases.lifecycle_status, 'ACTIVE')));

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

    // Read-repair: 마일스톤 기반 테스트 실행의 누락 케이스 자동 백필
    const [runMeta] = await db
      .select({ id: testRuns.id, milestone_id: testRuns.milestone_id })
      .from(testRuns)
      .where(eq(testRuns.id, testRunId));

    if (!runMeta) {
      return { success: false, errors: { _general: ['테스트 실행을 찾을 수 없습니다.'] } };
    }

    if (runMeta.milestone_id) {
      try {
        await repairTestRun(db, testRunId, runMeta.milestone_id);
      } catch (repairError) {
        // repair 실패해도 조회는 계속 진행
        console.error('repairTestRun failed:', repairError);
      }
    }

    const run = await db.query.testRuns.findFirst({
      where: eq(testRuns.id, testRunId),
      with: {
        testCaseRuns: {
          with: {
            testCase: true,
          },
        },
        testRunSuites: {
          with: {
            testSuite: true,
          },
        },
        milestone: true,
      },
    });

    if (!run) {
      return {
        success: false,
        errors: { _general: ['테스트 실행을 찾을 수 없습니다.'] },
      };
    }

    // Build source ID to name map
    const sourceIdToName = new Map<string, string>();
    const sources: SourceInfo[] = [];

    const hasSuites = run.testRunSuites && run.testRunSuites.length > 0;
    const hasMilestone = !!run.milestone;

    if (hasSuites) {
      for (const s of run.testRunSuites!) {
        if (s.testSuite) {
          sourceIdToName.set(s.testSuite.id, s.testSuite.name);
          sources.push({ id: s.testSuite.id, name: s.testSuite.name, type: 'suite' });
        }
      }
    }

    if (hasMilestone) {
      sourceIdToName.set(run.milestone!.id, run.milestone!.name);
      sources.push({ id: run.milestone!.id, name: run.milestone!.name, type: 'milestone' });
    }

    // Determine source type and name for header display
    let sourceType: TestRunDetail['sourceType'] = 'ADHOC';
    const sourceNameParts: string[] = [];

    if (hasSuites) {
      sourceType = 'SUITE';
      const suiteNames = run.testRunSuites!.map(s => s.testSuite?.name || '').filter(Boolean);
      if (suiteNames.length > 0) {
        sourceNameParts.push(`스위트: ${suiteNames.join(', ')}`);
      }
    }

    if (hasMilestone) {
      sourceType = hasSuites ? 'SUITE' : 'MILESTONE';
      if (run.milestone!.name) {
        sourceNameParts.push(`마일스톤: ${run.milestone!.name}`);
      }
    }

    const sourceName = sourceNameParts.length > 0 ? sourceNameParts.join(' | ') : '직접 선택한 케이스';

    // Collect unique test_suite_ids from test cases to fetch suite names
    const suiteIdSet = new Set<string>();
    for (const tcr of run.testCaseRuns || []) {
      if (tcr.testCase?.test_suite_id) {
        suiteIdSet.add(tcr.testCase.test_suite_id);
      }
    }
    const suiteIdToName = new Map<string, string>();
    if (suiteIdSet.size > 0) {
      const suiteRows = await db
        .select({ id: testSuites.id, name: testSuites.name })
        .from(testSuites)
        .where(inArray(testSuites.id, Array.from(suiteIdSet)));
      for (const row of suiteRows) {
        suiteIdToName.set(row.id, row.name);
      }
    }

    // Map test case runs with source information
    const testCaseRunDetails: TestCaseRunDetail[] = (run.testCaseRuns || []).map(tcr => ({
      id: tcr.id,
      testCaseId: tcr.test_case_id || '',
      code: tcr.testCase?.display_id
        ? `TC-${String(tcr.testCase.display_id).padStart(3, '0')}`
        : tcr.testCase?.case_key || '',
      title: tcr.testCase?.name || '',
      status: tcr.status,
      comment: tcr.comment,
      executedAt: tcr.executed_at,
      sourceType: (tcr.source_type as TestCaseRunSourceType) || 'adhoc',
      sourceId: tcr.source_id || null,
      sourceName: tcr.source_id ? (sourceIdToName.get(tcr.source_id) || null) : null,
      testSuiteId: tcr.testCase?.test_suite_id || null,
      testSuiteName: tcr.testCase?.test_suite_id ? (suiteIdToName.get(tcr.testCase.test_suite_id) || null) : null,
    }));

    // Calculate stats
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
      testCaseRuns: testCaseRunDetails,
      sources,
      stats: {
        total,
        untested,
        pass,
        fail,
        blocked,
        progressPercent,
      },
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

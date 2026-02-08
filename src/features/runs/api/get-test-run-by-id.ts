'use server';

import { getDatabase, testRuns, testCaseRuns, testCases, testSuites, TestRunStatus, TestCaseRunStatus, TestCaseRunSourceType } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { eq, inArray } from 'drizzle-orm';

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

export async function getTestRunById(testRunId: string): Promise<ActionResult<TestRunDetail>> {
  try {
    const db = getDatabase();

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
        testRunMilestones: {
          with: {
            milestone: true,
          },
        },
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
    const hasMilestones = run.testRunMilestones && run.testRunMilestones.length > 0;

    if (hasSuites) {
      for (const s of run.testRunSuites!) {
        if (s.testSuite) {
          sourceIdToName.set(s.testSuite.id, s.testSuite.name);
          sources.push({ id: s.testSuite.id, name: s.testSuite.name, type: 'suite' });
        }
      }
    }

    if (hasMilestones) {
      for (const m of run.testRunMilestones!) {
        if (m.milestone) {
          sourceIdToName.set(m.milestone.id, m.milestone.name);
          sources.push({ id: m.milestone.id, name: m.milestone.name, type: 'milestone' });
        }
      }
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

    if (hasMilestones) {
      sourceType = hasSuites ? 'SUITE' : 'MILESTONE';
      const milestoneNames = run.testRunMilestones!.map(m => m.milestone?.name || '').filter(Boolean);
      if (milestoneNames.length > 0) {
        sourceNameParts.push(`마일스톤: ${milestoneNames.join(', ')}`);
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
    console.error('Error fetching test run:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: { _general: [`테스트 실행을 불러오는 중 오류가 발생했습니다: ${errorMessage}`] },
    };
  }
}

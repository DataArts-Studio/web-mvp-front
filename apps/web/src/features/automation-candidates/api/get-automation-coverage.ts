'use server';

import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, testCases, testSuites } from '@testea/db';
import { and, eq, sql } from 'drizzle-orm';

import type { AutomationCoverageResult, CoverageBySuite } from '../types';

/**
 * 자동화 커버리지 집계 (읽기 전용).
 *
 * 프로젝트 ACTIVE 케이스 대비 automated 비율(%)과 스위트별 분포.
 * frontend 커버리지 대시보드용. query 이므로 가드 없음.
 */
export async function getAutomationCoverage(
  projectId: string
): Promise<ActionResult<AutomationCoverageResult>> {
  try {
    const db = getDatabase();

    // 스위트별 + 미배정(null) 분포를 한 번에 집계.
    const rows = await db
      .select({
        suiteId: testCases.test_suite_id,
        suiteName: testSuites.name,
        totalCases: sql<number>`count(*)`.mapWith(Number),
        automatedCases:
          sql<number>`count(*) filter (where ${testCases.automation_status} = 'automated')`.mapWith(
            Number
          ),
        candidateCases:
          sql<number>`count(*) filter (where ${testCases.automation_status} = 'candidate')`.mapWith(
            Number
          ),
        manualCases:
          sql<number>`count(*) filter (where ${testCases.automation_status} = 'manual')`.mapWith(
            Number
          ),
      })
      .from(testCases)
      // 스위트 미배정 케이스(null)도 포함되도록 left join.
      .leftJoin(testSuites, eq(testSuites.id, testCases.test_suite_id))
      .where(and(eq(testCases.project_id, projectId), eq(testCases.lifecycle_status, 'ACTIVE')))
      .groupBy(testCases.test_suite_id, testSuites.name);

    let totalCases = 0;
    let automatedCases = 0;
    let candidateCases = 0;
    let manualCases = 0;

    const bySuite: CoverageBySuite[] = rows.map((r) => {
      totalCases += r.totalCases;
      automatedCases += r.automatedCases;
      candidateCases += r.candidateCases;
      manualCases += r.manualCases;
      return {
        suiteId: r.suiteId,
        suiteName: r.suiteName ?? null,
        totalCases: r.totalCases,
        automatedCases: r.automatedCases,
        coveragePercent: r.totalCases > 0 ? Math.round((r.automatedCases / r.totalCases) * 100) : 0,
      };
    });

    bySuite.sort((a, b) => b.totalCases - a.totalCases);

    return {
      success: true,
      data: {
        totalCases,
        automatedCases,
        candidateCases,
        manualCases,
        coveragePercent: totalCases > 0 ? Math.round((automatedCases / totalCases) * 100) : 0,
        bySuite,
      },
    };
  } catch (error) {
    Sentry.captureException(error, {
      extra: { action: 'getAutomationCoverage', projectId },
    });
    return {
      success: false,
      errors: { _general: ['커버리지를 불러오는 중 오류가 발생했습니다.'] },
    };
  }
}

'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testRuns, testCaseRuns, projects } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { and, eq, isNull } from 'drizzle-orm';
import { requireProjectAccess } from '@/access/lib/require-access';

export interface SharedReportData {
  runName: string;
  projectName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  stats: {
    total: number;
    pass: number;
    fail: number;
    blocked: number;
    untested: number;
    progressPercent: number;
  };
}

export async function generateShareLink(
  testRunId: string
): Promise<ActionResult<{ token: string; expiresAt: string }>> {
  try {
    const db = getDatabase();

    const [run] = await db
      .select({ projectId: testRuns.project_id })
      .from(testRuns)
      .where(eq(testRuns.id, testRunId))
      .limit(1);

    if (!run?.projectId || !(await requireProjectAccess(run.projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db
      .update(testRuns)
      .set({
        share_token: token,
        share_expires_at: expiresAt,
        updated_at: new Date(),
      })
      .where(eq(testRuns.id, testRunId));

    return { success: true, data: { token, expiresAt: expiresAt.toISOString() } };
  } catch (error) {
    console.error('[generateShareLink] error:', error);
    Sentry.captureException(error, { extra: { action: 'generateShareLink' } });
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: { _general: [`공유 링크 생성 중 오류가 발생했습니다: ${errorMessage}`] },
    };
  }
}

export async function revokeShareLink(
  testRunId: string
): Promise<ActionResult<{ revoked: boolean }>> {
  try {
    const db = getDatabase();

    const [run] = await db
      .select({ projectId: testRuns.project_id })
      .from(testRuns)
      .where(eq(testRuns.id, testRunId))
      .limit(1);

    if (!run?.projectId || !(await requireProjectAccess(run.projectId))) {
      return { success: false, errors: { _general: ['접근 권한이 없습니다.'] } };
    }

    await db
      .update(testRuns)
      .set({
        share_token: null,
        share_expires_at: null,
        updated_at: new Date(),
      })
      .where(eq(testRuns.id, testRunId));

    return { success: true, data: { revoked: true } };
  } catch (error) {
    console.error('[revokeShareLink] error:', error);
    Sentry.captureException(error, { extra: { action: 'revokeShareLink' } });
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: { _general: [`공유 해제 중 오류가 발생했습니다: ${errorMessage}`] },
    };
  }
}

export async function getSharedReport(
  token: string
): Promise<ActionResult<SharedReportData>> {
  try {
    const db = getDatabase();

    const [run] = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.share_token, token))
      .limit(1);

    if (!run) {
      return {
        success: false,
        errors: { _general: ['유효하지 않은 공유 링크입니다.'] },
      };
    }

    if (!run.share_expires_at || new Date(run.share_expires_at) < new Date()) {
      return {
        success: false,
        errors: { _general: ['공유 링크가 만료되었습니다.'] },
      };
    }

    // Get project name
    let projectName = '';
    if (run.project_id) {
      const [project] = await db
        .select({ name: projects.name })
        .from(projects)
        .where(eq(projects.id, run.project_id))
        .limit(1);
      projectName = project?.name || '';
    }

    // Calculate stats (논리 삭제 제외)
    const caseRuns = await db
      .select({ status: testCaseRuns.status })
      .from(testCaseRuns)
      .where(and(eq(testCaseRuns.test_run_id, run.id), isNull(testCaseRuns.excluded_at)));
    const total = caseRuns.length;
    const pass = caseRuns.filter((c) => c.status === 'pass').length;
    const fail = caseRuns.filter((c) => c.status === 'fail').length;
    const blocked = caseRuns.filter((c) => c.status === 'blocked').length;
    const untested = caseRuns.filter((c) => c.status === 'untested').length;
    const completed = pass + fail + blocked;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      success: true,
      data: {
        runName: run.name,
        projectName,
        status: run.status,
        createdAt: new Date(run.created_at).toISOString(),
        updatedAt: new Date(run.updated_at).toISOString(),
        expiresAt: new Date(run.share_expires_at).toISOString(),
        stats: {
          total,
          pass,
          fail,
          blocked,
          untested,
          progressPercent,
        },
      },
    };
  } catch (error) {
    console.error('[getSharedReport] error:', error);
    Sentry.captureException(error, { extra: { action: 'getSharedReport' } });
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: { _general: [`리포트를 불러오는 중 오류가 발생했습니다: ${errorMessage}`] },
    };
  }
}

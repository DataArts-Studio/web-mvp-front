'use server';

import * as Sentry from '@sentry/nextjs';
import { getDatabase, testRuns, projects } from '@/shared/lib/db';
import { ActionResult } from '@/shared/types';
import { eq, and, gt } from 'drizzle-orm';
import { requireProjectAccess } from '@/access/lib/require-access';

export interface SharedReportData {
  runName: string;
  projectName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
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
): Promise<ActionResult<{ token: string; expiresAt: Date }>> {
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

    return { success: true, data: { token, expiresAt } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'generateShareLink' } });
    return {
      success: false,
      errors: { _general: ['공유 링크 생성 중 오류가 발생했습니다.'] },
    };
  }
}

export async function revokeShareLink(
  testRunId: string
): Promise<ActionResult<void>> {
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

    return { success: true, data: undefined };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'revokeShareLink' } });
    return {
      success: false,
      errors: { _general: ['공유 해제 중 오류가 발생했습니다.'] },
    };
  }
}

export async function getSharedReport(
  token: string
): Promise<ActionResult<SharedReportData>> {
  try {
    const db = getDatabase();

    const run = await db.query.testRuns.findFirst({
      where: eq(testRuns.share_token, token),
      with: {
        testCaseRuns: true,
      },
    });

    if (!run) {
      return {
        success: false,
        errors: { _general: ['유효하지 않은 공유 링크입니다.'] },
      };
    }

    if (!run.share_expires_at || run.share_expires_at < new Date()) {
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

    // Calculate stats
    const caseRuns = run.testCaseRuns || [];
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
        createdAt: run.created_at,
        updatedAt: run.updated_at,
        expiresAt: run.share_expires_at,
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
    Sentry.captureException(error, { extra: { action: 'getSharedReport' } });
    return {
      success: false,
      errors: { _general: ['리포트를 불러오는 중 오류가 발생했습니다.'] },
    };
  }
}

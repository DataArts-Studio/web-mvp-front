'use server';

import { ACCESS_DENIED, canAccess } from '@/access/lib/project-scope';
import type { RunIssueContext } from '@/entities/test-run';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import {
  getDatabase,
  githubConnections,
  testCaseExternalLinks,
  testCaseRuns,
  testRuns,
} from '@testea/db';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';

/** 실행 결과 화면에서 이슈를 등록할 저장소와 케이스별 연결 이슈 (06i). */
export async function getRunIssueContext(
  testRunId: string
): Promise<ActionResult<RunIssueContext>> {
  try {
    if (!(await canAccess('testRun', testRunId))) return ACCESS_DENIED;

    const db = getDatabase();
    const [run] = await db
      .select({ projectId: testRuns.project_id })
      .from(testRuns)
      .where(eq(testRuns.id, testRunId))
      .limit(1);
    if (!run?.projectId) {
      return { success: false, errors: { _general: ['테스트 실행을 찾을 수 없습니다.'] } };
    }

    const [conn] = await db
      .select({ repoFullName: githubConnections.repo_full_name })
      .from(githubConnections)
      .where(eq(githubConnections.project_id, run.projectId))
      .limit(1);

    const caseRows = await db
      .select({ testCaseId: testCaseRuns.test_case_id })
      .from(testCaseRuns)
      .where(and(eq(testCaseRuns.test_run_id, testRunId), isNull(testCaseRuns.excluded_at)));
    const caseIds = [...new Set(caseRows.map((r) => r.testCaseId).filter(Boolean))] as string[];

    const links =
      caseIds.length > 0
        ? await db
            .select({
              testCaseId: testCaseExternalLinks.test_case_id,
              number: testCaseExternalLinks.external_id,
              url: testCaseExternalLinks.external_url,
              title: testCaseExternalLinks.title,
              status: testCaseExternalLinks.status,
            })
            .from(testCaseExternalLinks)
            .where(
              and(
                inArray(testCaseExternalLinks.test_case_id, caseIds),
                eq(testCaseExternalLinks.link_type, 'github_issue')
              )
            )
            .orderBy(desc(testCaseExternalLinks.created_at))
        : [];

    const issuesByCase: RunIssueContext['issuesByCase'] = {};
    for (const link of links) {
      (issuesByCase[link.testCaseId] ??= []).push({
        number: link.number,
        url: link.url,
        title: link.title,
        status: link.status,
      });
    }

    return {
      success: true,
      data: { repoFullName: conn?.repoFullName ?? null, issuesByCase },
    };
  } catch (error) {
    console.error('[getRunIssueContext] Error:', error);
    Sentry.captureException(error, { extra: { action: 'getRunIssueContext', testRunId } });
    return { success: false, errors: { _general: ['이슈 정보를 불러오지 못했습니다.'] } };
  }
}

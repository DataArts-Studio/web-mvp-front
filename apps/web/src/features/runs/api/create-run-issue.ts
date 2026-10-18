'use server';

import { ACCESS_DENIED, canAccess } from '@/access/lib/project-scope';
import { githubApi } from '@/entities/github-connection/lib/github-api';
import { decrypt } from '@/shared/lib/crypto';
import type { ActionResult } from '@/shared/types';
import * as Sentry from '@sentry/nextjs';
import {
  getDatabase,
  githubConnections,
  testCaseExternalLinks,
  testCaseRuns,
  testRuns,
} from '@testea/db';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';

const InputSchema = z.object({
  testRunId: z.string().uuid(),
  testCaseRunIds: z.array(z.string().uuid()).min(1).max(20),
  title: z.string().trim().min(1, '이슈 제목을 입력해주세요.').max(256),
  body: z.string().max(10000),
});

/** owner/repo 형식만 요청 경로에 넣는다. */
const REPO_NAME = /^[\w.-]+\/[\w.-]+$/;

const IssueResponseSchema = z.object({
  number: z.number(),
  html_url: z.string().url(),
  title: z.string(),
  state: z.string(),
});

/**
 * 실행 결과에서 GitHub 이슈를 만들고 고른 케이스 모두에 연결한다 (06i).
 * 받은 결과 ID 는 모두 이 실행의 것이어야 한다. 하나라도 아니면 만들지 않는다.
 */
export async function createRunIssue(
  input: z.input<typeof InputSchema>
): Promise<ActionResult<{ issueUrl: string; number: number }>> {
  try {
    const parsed = InputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        errors: { _general: [parsed.error.issues[0]?.message ?? '입력이 올바르지 않습니다.'] },
      };
    }
    const { testRunId, testCaseRunIds, title, body } = parsed.data;
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

    const ids = [...new Set(testCaseRunIds)];
    const caseRows = await db
      .select({ testCaseId: testCaseRuns.test_case_id })
      .from(testCaseRuns)
      .where(
        and(
          eq(testCaseRuns.test_run_id, testRunId),
          inArray(testCaseRuns.id, ids),
          isNull(testCaseRuns.excluded_at)
        )
      );
    if (caseRows.length !== ids.length) {
      return {
        success: false,
        errors: { _general: ['이 실행의 케이스만 이슈에 연결할 수 있습니다.'] },
      };
    }
    const caseIds = [...new Set(caseRows.map((r) => r.testCaseId).filter(Boolean))] as string[];

    const [conn] = await db
      .select({
        repoFullName: githubConnections.repo_full_name,
        token: githubConnections.access_token,
      })
      .from(githubConnections)
      .where(eq(githubConnections.project_id, run.projectId))
      .limit(1);
    if (!conn?.repoFullName || !REPO_NAME.test(conn.repoFullName)) {
      return { success: false, errors: { _general: ['GitHub 저장소를 먼저 연결해주세요.'] } };
    }

    const issue = IssueResponseSchema.parse(
      await githubApi(decrypt(conn.token), `/repos/${conn.repoFullName}/issues`, {
        method: 'POST',
        body: JSON.stringify({ title, body, labels: ['testea', 'bug'] }),
      })
    );

    if (caseIds.length > 0) {
      await db.insert(testCaseExternalLinks).values(
        caseIds.map((testCaseId) => ({
          test_case_id: testCaseId,
          link_type: 'github_issue' as const,
          external_url: issue.html_url,
          external_id: String(issue.number),
          repo_full_name: conn.repoFullName!,
          title: issue.title,
          status: issue.state,
        }))
      );
    }

    return { success: true, data: { issueUrl: issue.html_url, number: issue.number } };
  } catch (error) {
    console.error('[createRunIssue] Error:', error);
    Sentry.captureException(error, { extra: { action: 'createRunIssue' } });
    return {
      success: false,
      errors: { _general: ['이슈를 만들지 못했습니다. GitHub 연결 상태를 확인해주세요.'] },
    };
  }
}

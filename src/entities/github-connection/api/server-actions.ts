'use server';

import * as Sentry from '@sentry/nextjs';
import { eq, and, asc } from 'drizzle-orm';
import { getDatabase, githubConnections, testCaseExternalLinks, testCases } from '@/shared/lib/db';
import { encrypt, decrypt } from '@/shared/lib/crypto';
import type { ActionResult } from '@/shared/types';
import type { GithubConnection, ExternalLink, GithubRepo } from '../model/types';
import { ConnectGithubSchema, SelectRepoSchema, CreateGithubIssueSchema } from '../model/schema';
import crypto from 'crypto';

// --- OAuth code → access_token 교환 ---
async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data.access_token;
}

// --- GitHub API 호출 헬퍼 ---
async function githubApi(token: string, path: string, options?: RequestInit) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }
  return res.json();
}

// --- 연결 (OAuth code 교환 + 저장) ---
export const connectGithub = async (
  input: { projectId: string; code: string },
): Promise<ActionResult<{ connection: GithubConnection }>> => {
  try {
    const parsed = ConnectGithubSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, errors: { _github: [parsed.error.errors[0].message] } };
    }

    const { projectId, code } = parsed.data;
    const accessToken = await exchangeCodeForToken(code);
    const encryptedToken = encrypt(accessToken);

    const db = getDatabase();

    // 기존 연결이 있으면 업데이트
    const [existing] = await db
      .select({ id: githubConnections.id })
      .from(githubConnections)
      .where(eq(githubConnections.project_id, projectId))
      .limit(1);

    if (existing) {
      await db
        .update(githubConnections)
        .set({
          access_token: encryptedToken,
          updated_at: new Date(),
        })
        .where(eq(githubConnections.id, existing.id));
    }

    return {
      success: true,
      data: {
        connection: {
          id: existing?.id ?? '',
          projectId,
          repoFullName: '',
          connectedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'connectGithub' } });
    return { success: false, errors: { _github: ['GitHub 연결에 실패했습니다.'] } };
  }
};

// --- 저장소 목록 조회 ---
export const getGithubRepos = async (
  projectId: string,
): Promise<ActionResult<GithubRepo[]>> => {
  try {
    const db = getDatabase();
    const [conn] = await db
      .select()
      .from(githubConnections)
      .where(eq(githubConnections.project_id, projectId))
      .limit(1);

    if (!conn) {
      return { success: false, errors: { _github: ['GitHub이 연결되지 않았습니다.'] } };
    }

    const token = decrypt(conn.access_token);
    const repos = await githubApi(token, '/user/repos?per_page=100&sort=updated');

    return { success: true, data: repos };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getGithubRepos' } });
    return { success: false, errors: { _github: ['저장소 목록을 불러올 수 없습니다.'] } };
  }
};

// --- 저장소 선택 + Webhook 등록 ---
export const selectGithubRepo = async (
  input: { projectId: string; repoFullName: string },
): Promise<ActionResult<{ connection: GithubConnection }>> => {
  try {
    const parsed = SelectRepoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, errors: { _github: [parsed.error.errors[0].message] } };
    }

    const { projectId, repoFullName } = parsed.data;
    const db = getDatabase();

    const [conn] = await db
      .select()
      .from(githubConnections)
      .where(eq(githubConnections.project_id, projectId))
      .limit(1);

    if (!conn) {
      return { success: false, errors: { _github: ['먼저 GitHub 인증을 완료해주세요.'] } };
    }

    const token = decrypt(conn.access_token);
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Webhook 등록
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gettestea.com';
    const webhook = await githubApi(token, `/repos/${repoFullName}/hooks`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['pull_request'],
        config: {
          url: `${appUrl}/api/webhooks/github`,
          content_type: 'json',
          secret: webhookSecret,
        },
      }),
    });

    // DB 업데이트
    const [updated] = await db
      .update(githubConnections)
      .set({
        repo_full_name: repoFullName,
        webhook_id: String(webhook.id),
        webhook_secret: encrypt(webhookSecret),
        updated_at: new Date(),
      })
      .where(eq(githubConnections.id, conn.id))
      .returning();

    return {
      success: true,
      data: {
        connection: {
          id: updated.id,
          projectId: updated.project_id,
          repoFullName: updated.repo_full_name,
          connectedAt: updated.connected_at.toISOString(),
          updatedAt: updated.updated_at.toISOString(),
        },
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'selectGithubRepo' } });
    return { success: false, errors: { _github: ['저장소 연결에 실패했습니다.'] } };
  }
};

// --- 연결 해제 ---
export const disconnectGithub = async (
  projectId: string,
): Promise<ActionResult<null>> => {
  try {
    const db = getDatabase();

    const [conn] = await db
      .select()
      .from(githubConnections)
      .where(eq(githubConnections.project_id, projectId))
      .limit(1);

    if (!conn) {
      return { success: true, data: null };
    }

    // Webhook 삭제
    if (conn.webhook_id && conn.repo_full_name) {
      try {
        const token = decrypt(conn.access_token);
        await githubApi(token, `/repos/${conn.repo_full_name}/hooks/${conn.webhook_id}`, {
          method: 'DELETE',
        });
      } catch {
        // Webhook 삭제 실패해도 연결 해제는 진행
      }
    }

    await db.delete(githubConnections).where(eq(githubConnections.id, conn.id));

    return { success: true, data: null };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'disconnectGithub' } });
    return { success: false, errors: { _github: ['연결 해제에 실패했습니다.'] } };
  }
};

// --- 연결 상태 조회 ---
export const getGithubConnection = async (
  projectId: string,
): Promise<ActionResult<GithubConnection | null>> => {
  try {
    const db = getDatabase();

    const [conn] = await db
      .select({
        id: githubConnections.id,
        project_id: githubConnections.project_id,
        repo_full_name: githubConnections.repo_full_name,
        connected_at: githubConnections.connected_at,
        updated_at: githubConnections.updated_at,
      })
      .from(githubConnections)
      .where(eq(githubConnections.project_id, projectId))
      .limit(1);

    if (!conn) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        id: conn.id,
        projectId: conn.project_id,
        repoFullName: conn.repo_full_name,
        connectedAt: conn.connected_at.toISOString(),
        updatedAt: conn.updated_at.toISOString(),
      },
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getGithubConnection' } });
    return { success: false, errors: { _github: ['연결 상태를 확인할 수 없습니다.'] } };
  }
};

// --- TC 외부 링크 목록 ---
export const getExternalLinks = async (
  testCaseId: string,
): Promise<ActionResult<ExternalLink[]>> => {
  try {
    const db = getDatabase();

    const links = await db
      .select()
      .from(testCaseExternalLinks)
      .where(eq(testCaseExternalLinks.test_case_id, testCaseId))
      .orderBy(asc(testCaseExternalLinks.created_at));

    return {
      success: true,
      data: links.map((l) => ({
        id: l.id,
        testCaseId: l.test_case_id,
        linkType: l.link_type,
        externalUrl: l.external_url,
        externalId: l.external_id,
        repoFullName: l.repo_full_name,
        title: l.title,
        status: l.status,
        createdAt: l.created_at.toISOString(),
      })),
    };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'getExternalLinks' } });
    return { success: false, errors: { _github: ['외부 링크를 불러올 수 없습니다.'] } };
  }
};

// --- GitHub Issue 생성 ---
export const createGithubIssue = async (
  input: { testCaseId: string; title: string; body?: string },
): Promise<ActionResult<{ issueUrl: string }>> => {
  try {
    const parsed = CreateGithubIssueSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, errors: { _github: [parsed.error.errors[0].message] } };
    }

    const { testCaseId, title, body } = parsed.data;
    const db = getDatabase();

    // TC의 프로젝트 확인
    const [tc] = await db
      .select({ project_id: testCases.project_id, display_id: testCases.display_id, name: testCases.name })
      .from(testCases)
      .where(eq(testCases.id, testCaseId))
      .limit(1);

    if (!tc?.project_id) {
      return { success: false, errors: { _github: ['테스트 케이스를 찾을 수 없습니다.'] } };
    }

    // GitHub 연결 확인
    const [conn] = await db
      .select()
      .from(githubConnections)
      .where(eq(githubConnections.project_id, tc.project_id))
      .limit(1);

    if (!conn || !conn.repo_full_name) {
      return { success: false, errors: { _github: ['GitHub이 연결되지 않았습니다.'] } };
    }

    const token = decrypt(conn.access_token);

    const issueBody = body || `## 테스트 실패 보고\n\n**테스트 케이스**: TC-${tc.display_id} ${tc.name}\n\n---\n*이 이슈는 [Testea](https://gettestea.com)에서 자동 생성되었습니다.*`;

    const issue = await githubApi(token, `/repos/${conn.repo_full_name}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body: issueBody,
        labels: ['testea', 'bug'],
      }),
    });

    // 링크 저장
    await db.insert(testCaseExternalLinks).values({
      test_case_id: testCaseId,
      link_type: 'github_issue',
      external_url: issue.html_url,
      external_id: String(issue.number),
      repo_full_name: conn.repo_full_name,
      title: issue.title,
      status: issue.state,
    });

    return { success: true, data: { issueUrl: issue.html_url } };
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'createGithubIssue' } });
    return { success: false, errors: { _github: ['이슈 생성에 실패했습니다. GitHub 연동 상태를 확인해주세요.'] } };
  }
};

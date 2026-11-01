import { NextRequest, NextResponse } from 'next/server';

import { parseTcIds } from '@/features/github-links/lib/parse-tc-ids';
import { decrypt } from '@/shared/lib/crypto';
import * as Sentry from '@sentry/nextjs';
import {
  getDatabase,
  githubConnections,
  projects,
  testCaseExternalLinks,
  testCases,
} from '@testea/db';
import crypto from 'crypto';
import { and, eq, inArray } from 'drizzle-orm';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  // 길이가 다르면 timingSafeEqual 이 throw 하므로 먼저 거부
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

/** 링크를 갱신하는 PR 액션. 코멘트는 이 중 COMMENT_ACTIONS 에서만 단다. */
const HANDLED_ACTIONS = ['opened', 'reopened', 'edited', 'closed'];
/**
 * PR 코멘트를 새로 다는 액션. edited·reopened 에서 코멘트를 달면 같은 표가 반복해 쌓인다.
 * 그 액션에서는 링크만 갱신하고 코멘트는 처음 열릴 때 한 번만 단다.
 */
const COMMENT_ACTIONS = ['opened'];

export async function POST(req: NextRequest) {
  try {
    const event = req.headers.get('x-github-event');
    const signature = req.headers.get('x-hub-signature-256');

    if (!event || !signature) {
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    // pull_request 이벤트만 처리
    if (event !== 'pull_request') {
      return NextResponse.json({ message: 'Ignored event' }, { status: 200 });
    }

    const action = payload.action;
    if (!HANDLED_ACTIONS.includes(action)) {
      return NextResponse.json({ message: 'Ignored action' }, { status: 200 });
    }

    const repoFullName = payload.repository?.full_name;
    if (!repoFullName) {
      return NextResponse.json({ error: 'Missing repository' }, { status: 400 });
    }

    // 해당 repo에 연결된 프로젝트 찾기
    const db = getDatabase();
    const [conn] = await db
      .select()
      .from(githubConnections)
      .where(eq(githubConnections.repo_full_name, repoFullName))
      .limit(1);

    // Webhook 서명 검증 (시크릿 미설정 시 fail-closed: 미서명 페이로드 거부).
    // 서명 확인 전에는 연결 없음·시크릿 없음·서명 불일치를 같은 응답으로 돌려
    // 어떤 저장소가 연결돼 있는지 드러나지 않게 한다.
    let secret: string | null = null;
    if (conn?.webhook_secret) {
      try {
        secret = decrypt(conn.webhook_secret);
      } catch (decryptError) {
        // 복호화 실패도 500 대신 같은 401로 돌려 연결 여부를 숨긴다.
        Sentry.captureException(decryptError, { extra: { action: 'webhookSecretDecrypt' } });
      }
    }
    if (!conn || !secret || !verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 보관·삭제된 프로젝트에는 외부 이벤트로 링크를 새로 만들거나 코멘트를 달지 않는다.
    // 기존 링크의 PR 상태 갱신은 계속해, 복원했을 때 닫힌 PR 이 open 으로 남지 않게 한다.
    const [project] = await db
      .select({ lifecycle_status: projects.lifecycle_status })
      .from(projects)
      .where(eq(projects.id, conn.project_id))
      .limit(1);
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 200 });
    }
    const projectActive = project.lifecycle_status === 'ACTIVE';

    const pr = payload.pull_request;
    const prTitle = pr?.title || '';
    const prBody = pr?.body || '';
    const prNumber = pr?.number;
    const prUrl = pr?.html_url;
    const prState = pr?.merged ? 'merged' : pr?.state;

    // TC-XXX 패턴 파싱
    const displayIds = parseTcIds(`${prTitle} ${prBody}`);
    if (displayIds.length === 0) {
      return NextResponse.json({ message: 'No TC references found' }, { status: 200 });
    }

    // display_id로 TC 조회. 기존 링크 상태 갱신은 보관·휴지통 케이스도 대상으로 한다
    // (복원했을 때 닫힌 PR 이 open 으로 남지 않게). 새 링크와 코멘트는 활성 케이스만.
    const referencedCases = await db
      .select({
        id: testCases.id,
        display_id: testCases.display_id,
        name: testCases.name,
        lifecycle_status: testCases.lifecycle_status,
        archived_at: testCases.archived_at,
      })
      .from(testCases)
      .where(
        and(eq(testCases.project_id, conn.project_id), inArray(testCases.display_id, displayIds))
      );
    const isActiveCase = (tc: (typeof referencedCases)[number]) =>
      projectActive && tc.lifecycle_status === 'ACTIVE' && tc.archived_at === null;
    const matchedCases = referencedCases.filter(isActiveCase);

    if (referencedCases.length === 0) {
      return NextResponse.json({ message: 'No matching TCs' }, { status: 200 });
    }

    // 링크 생성 (중복 방지: 같은 TC + 같은 PR number는 업데이트)
    for (const tc of referencedCases) {
      const isActive = isActiveCase(tc);
      const [existing] = await db
        .select({ id: testCaseExternalLinks.id })
        .from(testCaseExternalLinks)
        .where(
          and(
            eq(testCaseExternalLinks.test_case_id, tc.id),
            eq(testCaseExternalLinks.external_id, String(prNumber)),
            eq(testCaseExternalLinks.link_type, 'github_pr')
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(testCaseExternalLinks)
          .set({ title: prTitle, status: prState })
          .where(eq(testCaseExternalLinks.id, existing.id));
      } else if (isActive) {
        await db.insert(testCaseExternalLinks).values({
          test_case_id: tc.id,
          link_type: 'github_pr',
          external_url: prUrl,
          external_id: String(prNumber),
          repo_full_name: repoFullName,
          title: prTitle,
          status: prState,
        });
      }
    }

    // PR에 코멘트 작성 (opened 시에만)
    if (COMMENT_ACTIONS.includes(action) && matchedCases.length > 0) {
      try {
        const token = decrypt(conn.access_token);

        const statusEmoji: Record<string, string> = {
          untested: '⬜',
          pass: '✅',
          fail: '❌',
          blocked: '🚫',
        };

        const rows = matchedCases
          .map(
            (tc) =>
              `| TC-${tc.display_id} | ${tc.name} | ${statusEmoji['untested'] || '⬜'} Untested |`
          )
          .join('\n');

        const commentBody = `🧪 **Testea** - 연결된 테스트 케이스\n\n| ID | 이름 | 상태 |\n|---|---|---|\n${rows}\n\n---\n*[Testea](https://gettestea.com)에서 자동 생성된 코멘트입니다.*`;

        await fetch(`https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body: commentBody }),
        });
      } catch (commentError) {
        // 코멘트 실패는 링크 생성에 영향 없음
        Sentry.captureException(commentError, { extra: { action: 'webhookComment' } });
      }
    }

    return NextResponse.json({ message: 'OK', linked: matchedCases.length }, { status: 200 });
  } catch (error) {
    Sentry.captureException(error, { extra: { action: 'githubWebhook' } });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

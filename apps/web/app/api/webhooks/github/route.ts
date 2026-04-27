import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, githubConnections, testCaseExternalLinks, testCases } from '@testea/db';
import { decrypt } from '@/shared/lib/crypto';
import { eq, and, inArray } from 'drizzle-orm';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// PR 본문에서 TC-XXX 패턴 파싱
function parseTcIds(text: string): number[] {
  const matches = text.match(/TC-(\d{3,})/gi);
  if (!matches) return [];
  return [...new Set(matches.map((m) => parseInt(m.replace(/TC-/i, ''), 10)))];
}

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
    if (!['opened', 'edited', 'closed'].includes(action)) {
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

    if (!conn) {
      return NextResponse.json({ message: 'No matching project' }, { status: 200 });
    }

    // Webhook 서명 검증
    if (conn.webhook_secret) {
      const secret = decrypt(conn.webhook_secret);
      if (!verifySignature(rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

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

    // display_id로 TC 조회
    const matchedCases = await db
      .select({ id: testCases.id, display_id: testCases.display_id, name: testCases.name })
      .from(testCases)
      .where(
        and(
          eq(testCases.project_id, conn.project_id),
          inArray(testCases.display_id, displayIds),
        ),
      );

    if (matchedCases.length === 0) {
      return NextResponse.json({ message: 'No matching TCs' }, { status: 200 });
    }

    // 링크 생성 (중복 방지: 같은 TC + 같은 PR number는 업데이트)
    for (const tc of matchedCases) {
      const [existing] = await db
        .select({ id: testCaseExternalLinks.id })
        .from(testCaseExternalLinks)
        .where(
          and(
            eq(testCaseExternalLinks.test_case_id, tc.id),
            eq(testCaseExternalLinks.external_id, String(prNumber)),
            eq(testCaseExternalLinks.link_type, 'github_pr'),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(testCaseExternalLinks)
          .set({ title: prTitle, status: prState })
          .where(eq(testCaseExternalLinks.id, existing.id));
      } else {
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

    // PR에 코멘트 작성 (opened/edited 시에만)
    if (['opened', 'edited'].includes(action)) {
      try {
        const token = decrypt(conn.access_token);

        const statusEmoji: Record<string, string> = {
          untested: '⬜',
          pass: '✅',
          fail: '❌',
          blocked: '🚫',
        };

        const rows = matchedCases
          .map((tc) => `| TC-${tc.display_id} | ${tc.name} | ${statusEmoji['untested'] || '⬜'} Untested |`)
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

import { NextResponse } from 'next/server';

import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    type: z.enum(['bug', 'idea', 'etc']).optional(),
    body: z.string().trim().min(5).max(4000),
    pageUrl: z.string().trim().max(300).optional(),
  })
  .strict();

const TYPE_LABEL: Record<string, string> = { bug: '버그', idea: '제안', etc: '기타' };

// 유형 → 레포 라벨(레포에 이미 존재하는 라벨만 사용. 없는 라벨이면 422). 빈 값은 미부착.
const TYPE_GH_LABEL: Record<string, string> = {
  bug: '🐛 type: bug',
  idea: '✨ type: feature',
  etc: '',
};

// 간단 인메모리 레이트리밋. 서버 인스턴스별이라 콜드스타트 시 리셋되는 약한 방어지만,
// 공개 엔드포인트의 1차 남용 차단용. 운영 스케일 시 Redis 등으로 교체.
const WINDOW_MS = 60 * 60 * 1000; // 1시간
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

/**
 * POST /api/issues
 *
 * qaground 사용자 제보를 GitHub 이슈로 등록한다.
 * - 토큰은 서버 환경변수(QAGROUND_GH_ISSUE_TOKEN)로만 사용, 클라이언트에 노출하지 않는다.
 * - 공개 엔드포인트이므로 입력 검증 + 길이 제한 + 레이트리밋으로 남용을 막는다.
 * - 레포는 private 이므로 생성된 이슈 URL 을 클라이언트에 반환하지 않는다.
 * - 토큰 미설정 시 503 으로 안내(배포 측에서 주입).
 */
export async function POST(request: Request) {
  const token = process.env.QAGROUND_GH_ISSUE_TOKEN;
  const repo = process.env.QAGROUND_GH_ISSUE_REPO ?? 'DataArts-Studio/web-mvp-front';
  if (!token) {
    return NextResponse.json({ error: '이슈 등록이 아직 설정되지 않았습니다.' }, { status: 503 });
  }

  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: '요청이 많습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 429 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: '제목과 내용을 확인해 주세요.' }, { status: 400 });
  }
  const { title, type, body, pageUrl } = parsed.data;

  const typeLabel = type ? TYPE_LABEL[type] : '기타';
  const issueTitle = `[제보/${typeLabel}] ${title}`;
  const typeGhLabel = type ? TYPE_GH_LABEL[type] : '';
  const labels = ['qaground', ...(typeGhLabel ? [typeGhLabel] : [])];
  const assignee = process.env.QAGROUND_GH_ISSUE_ASSIGNEE ?? 'JangHwanPark';
  const issueBody = [body, '', '---', '_qaground 사용자 제보_', pageUrl ? `페이지: ${pageUrl}` : '']
    .filter(Boolean)
    .join('\n');

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels,
        assignees: [assignee],
      }),
    });
    if (!res.ok) {
      console.error('[issues] GitHub 이슈 생성 실패', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ error: '이슈 등록에 실패했습니다.' }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[issues] GitHub 호출 오류', error);
    return NextResponse.json({ error: '이슈 등록에 실패했습니다.' }, { status: 502 });
  }
}

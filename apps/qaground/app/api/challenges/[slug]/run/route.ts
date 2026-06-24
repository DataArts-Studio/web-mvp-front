import { NextResponse } from 'next/server';

import { getChallenge } from '@/shared/challenges/registry';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BodySchema = z
  .object({
    code: z.string().min(1).max(20_000),
  })
  .strict();

/**
 * POST /api/challenges/[slug]/run
 *
 * Automation 트랙 코드 채점 오케스트레이터. 사용자가 작성한 Playwright spec 을
 * 격리 러너로 보내 연습 대상(샌드박스)에서 실행시키고 통과/실패를 돌려준다.
 *
 * - MVP 채점(모델 A): 사용자 spec 의 단언이 통과하면 합격.
 * - 러너 미연결(QAGROUND_RUNNER_URL/SECRET 미설정): 503 으로 안내(배포 후 연결).
 * - 보안: 러너는 비신뢰 코드 실행이므로 일회용 격리 컨테이너 전제(러너 배포 측 책임).
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge || !challenge.sandboxSlug) {
    return NextResponse.json({ error: '챌린지를 찾을 수 없습니다.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '제출 코드가 올바르지 않습니다.' }, { status: 400 });
  }

  const runnerUrl = process.env.QAGROUND_RUNNER_URL;
  const runnerSecret = process.env.QAGROUND_RUNNER_SECRET;
  if (!runnerUrl || !runnerSecret) {
    return NextResponse.json({ error: '채점 서버가 아직 연결되지 않았습니다.' }, { status: 503 });
  }

  // 러너가 spec 을 실행할 대상 URL. 현재는 qaground 가 서빙하는 샌드박스 주소.
  // (하드닝 단계에서 샌드박스를 러너 이미지에 번들 + network=none 으로 전환 예정.)
  const origin = new URL(request.url).origin;
  const baseUrl = `${origin}/sandbox/${challenge.sandboxSlug}`;

  try {
    const res = await fetch(`${runnerUrl.replace(/\/$/, '')}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Runner-Secret': runnerSecret,
      },
      body: JSON.stringify({ spec: parsed.data.code, baseUrl, timeoutMs: 30_000 }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      return NextResponse.json({ error: '러너 실행에 실패했습니다.' }, { status: 502 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('[challenges/run] 러너 호출 실패', error);
    return NextResponse.json({ error: '채점 서버에 연결하지 못했습니다.' }, { status: 502 });
  }
}

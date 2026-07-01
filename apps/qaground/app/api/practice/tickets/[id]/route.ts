import { NextResponse } from 'next/server';

import { isAuthorized } from '@/shared/practice-api/auth';
import { findTicket } from '@/shared/practice-api/data';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UpdateSchema = z
  .object({
    status: z.enum(['open', 'pending', 'resolved']).optional(),
    assignee: z.string().trim().min(1).max(50).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: '수정할 필드가 없습니다.' });

function parseId(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null;
}

/**
 * GET /api/practice/tickets/:id
 * - 숫자가 아닌 id: 400 / 없음: 404 / 존재: 200 { ...ticket }.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticketId = parseId(id);
  if (ticketId === null) {
    return NextResponse.json({ error: 'id는 숫자여야 합니다.' }, { status: 400 });
  }

  const ticket = findTicket(ticketId);
  if (!ticket) {
    return NextResponse.json({ error: '티켓을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json(ticket);
}

/**
 * PATCH /api/practice/tickets/:id
 * - 인증 필요: 토큰 없으면 401.
 * - 상태·담당자 변경. 본문 검증 실패: 400 / 없음: 404 / 성공: 200.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const ticketId = parseId(id);
  if (ticketId === null) {
    return NextResponse.json({ error: 'id는 숫자여야 합니다.' }, { status: 400 });
  }

  const ticket = findTicket(ticketId);
  if (!ticket) {
    return NextResponse.json({ error: '티켓을 찾을 수 없습니다.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  return NextResponse.json({ ...ticket, ...parsed.data });
}

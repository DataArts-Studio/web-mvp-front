import { NextResponse } from 'next/server';

import { findUser } from '@/shared/practice-api/data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/practice/users/:id
 * - 숫자가 아닌 id: 400 / 없음: 404 / 존재: 200 { ...user }
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'id는 숫자여야 합니다.' }, { status: 400 });
  }
  const user = findUser(Number(id));
  if (!user) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json(user);
}

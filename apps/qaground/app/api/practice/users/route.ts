import { NextResponse } from 'next/server';

import { USERS } from '@/shared/practice-api/data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/practice/users?page=1&limit=5&role=admin&active=true
 * - 페이지네이션(total·totalPages) + 선택적 role·active 필터.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '5') || 5));
  const role = searchParams.get('role');
  const active = searchParams.get('active');

  let filtered = USERS.slice();
  if (role) filtered = filtered.filter((u) => u.role === role);
  if (active === 'true') filtered = filtered.filter((u) => u.active);
  if (active === 'false') filtered = filtered.filter((u) => !u.active);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const data = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ page, limit, total, totalPages, data });
}

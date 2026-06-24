import { NextResponse } from 'next/server';

import { isAuthorized } from '@/shared/practice-api/auth';
import { PRODUCTS } from '@/shared/practice-api/data';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/practice/products?page=1&limit=5&category=주변기기
 * - 페이지네이션 + 선택적 카테고리 필터. 메타데이터(total·totalPages) 포함.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '5') || 5));
  const category = searchParams.get('category');

  const filtered = category ? PRODUCTS.filter((p) => p.category === category) : PRODUCTS;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const data = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ page, limit, total, totalPages, data });
}

const CreateSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    price: z.number().int().positive(),
    category: z.string().trim().min(1).max(50).optional(),
  })
  .strict();

/**
 * POST /api/practice/products
 * - 인증 필요: 토큰 없으면 401.
 * - 본문 검증 실패: 400 { error, issues }.
 * - 성공: 201 { id, ... } (실제로 영속하지 않는 데모 응답).
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const created = {
    id: PRODUCTS.length + 1,
    name: parsed.data.name,
    category: parsed.data.category ?? '기타',
    price: parsed.data.price,
    inStock: true,
  };
  return NextResponse.json(created, { status: 201 });
}

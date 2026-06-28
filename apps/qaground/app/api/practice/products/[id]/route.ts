import { NextResponse } from 'next/server';

import { isAuthorized } from '@/shared/practice-api/auth';
import { findProduct } from '@/shared/practice-api/data';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/** 경로 id 가 정수가 아니면 400. (입력 검증 연습용) */
function parseId(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null;
}

/**
 * GET /api/practice/products/:id
 * - 존재: 200 { ...product }
 * - 숫자가 아닌 id: 400 { error }
 * - 없음: 404 { error }
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = parseId(id);
  if (pid === null) {
    return NextResponse.json({ error: 'id는 숫자여야 합니다.' }, { status: 400 });
  }
  const product = findProduct(pid);
  if (!product) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json(product);
}

const UpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    price: z.number().int().positive().optional(),
    category: z.string().trim().min(1).max(50).optional(),
    inStock: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: '수정할 필드가 없습니다.' });

/**
 * PUT /api/practice/products/:id
 * - 인증 필요: 토큰 없으면 401.
 * - 숫자가 아닌 id: 400 / 없음: 404 / 본문 검증 실패: 400.
 * - 성공: 200 { ...updated } (데모라 실제 영속하지 않음).
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const { id } = await params;
  const pid = parseId(id);
  if (pid === null) {
    return NextResponse.json({ error: 'id는 숫자여야 합니다.' }, { status: 400 });
  }
  const product = findProduct(pid);
  if (!product) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 });
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
  return NextResponse.json({ ...product, ...parsed.data });
}

/**
 * DELETE /api/practice/products/:id
 * - 인증 필요: 토큰 없으면 401.
 * - 존재: 204 (no content, 데모라 실제 삭제는 안 함).
 * - 없음: 404 { error }.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  const { id } = await params;
  const pid = parseId(id);
  if (pid === null) {
    return NextResponse.json({ error: 'id는 숫자여야 합니다.' }, { status: 400 });
  }
  if (!findProduct(pid)) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}

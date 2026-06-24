import { NextResponse } from 'next/server';

import { isAuthorized } from '@/shared/practice-api/auth';
import { findProduct } from '@/shared/practice-api/data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/practice/products/:id
 * - 존재: 200 { ...product }
 * - 없음: 404 { error }
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = findProduct(Number(id));
  if (!product) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json(product);
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
  if (!findProduct(Number(id))) {
    return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}

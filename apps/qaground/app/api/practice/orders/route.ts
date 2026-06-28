import { NextResponse } from 'next/server';

import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ItemSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    qty: z.number().int().positive(),
    price: z.number().int().positive(),
  })
  .strict();

const CreateSchema = z
  .object({
    customer: z.string().trim().min(1).max(50),
    items: z.array(ItemSchema).min(1),
  })
  .strict();

let orderSeq = 2000;

/**
 * POST /api/practice/orders
 * - 본문 검증: customer·items 필수, items 비면/qty<=0/price<=0 이면 400 { error, issues }.
 * - 성공: 201 { id, customer, items, total, status }. total 은 서버가 계산(qty×price 합계).
 *   데모라 실제로 영속하지 않는다.
 */
export async function POST(request: Request) {
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
  const total = parsed.data.items.reduce((sum, it) => sum + it.qty * it.price, 0);
  return NextResponse.json(
    {
      id: (orderSeq += 1),
      customer: parsed.data.customer,
      items: parsed.data.items,
      total,
      status: 'created',
    },
    { status: 201 }
  );
}

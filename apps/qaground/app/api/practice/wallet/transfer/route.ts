import { NextResponse } from 'next/server';

import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BALANCE = 138000;
const TransferSchema = z
  .object({
    to: z.string().trim().min(1),
    amount: z.number().int().positive(),
  })
  .strict();

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = TransferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 }
    );
  }
  if (parsed.data.amount > BALANCE) {
    return NextResponse.json({ error: 'insufficient_balance', balance: BALANCE }, { status: 409 });
  }

  return NextResponse.json(
    { id: 'tx-9001', balanceAfter: BALANCE - parsed.data.amount },
    { status: 201 }
  );
}

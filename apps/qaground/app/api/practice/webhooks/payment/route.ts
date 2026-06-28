import { NextResponse } from 'next/server';

import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PayloadSchema = z
  .object({
    eventId: z.string().trim().min(1),
    type: z.enum(['payment.succeeded', 'payment.failed']),
    amount: z.number().int().positive(),
  })
  .strict();

export async function POST(request: Request) {
  if (request.headers.get('x-qaground-signature') !== 'test-signature') {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 }
    );
  }
  if (parsed.data.eventId === 'evt-duplicate') {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  return NextResponse.json({ ok: true, received: parsed.data.type });
}

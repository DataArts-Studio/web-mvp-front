import { NextResponse } from 'next/server';

import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ReportSchema = z
  .object({
    targetType: z.enum(['post', 'comment']),
    targetId: z.number().int().positive(),
    reason: z.string().trim().min(3).max(120),
  })
  .strict();

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = ReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 }
    );
  }
  if (parsed.data.targetId === 701) {
    return NextResponse.json({ error: 'duplicate_report' }, { status: 409 });
  }
  return NextResponse.json({ id: 'report-9001', status: 'received' }, { status: 201 });
}

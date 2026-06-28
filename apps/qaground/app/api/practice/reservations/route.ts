import { NextResponse } from 'next/server';

import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateSchema = z
  .object({
    slotId: z.string().min(1),
    name: z.string().trim().min(1).max(50),
    email: z.email(),
  })
  .strict();

const FULL_SLOTS = new Set(['slot-1000']);
const VALID_SLOTS = new Set(['slot-0900', 'slot-1000', 'slot-1100', 'slot-0900-2']);

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
  if (!VALID_SLOTS.has(parsed.data.slotId)) {
    return NextResponse.json({ error: 'slot_not_found' }, { status: 404 });
  }
  if (FULL_SLOTS.has(parsed.data.slotId)) {
    return NextResponse.json({ error: 'slot_full' }, { status: 409 });
  }

  return NextResponse.json(
    { id: 'resv-9001', status: 'confirmed', ...parsed.data },
    { status: 201 }
  );
}

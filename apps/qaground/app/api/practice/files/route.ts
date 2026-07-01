import { NextResponse } from 'next/server';

import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'application/pdf']);
const MAX_SIZE = 5 * 1024 * 1024;

const UploadSchema = z
  .object({
    fileName: z.string().trim().min(1).max(120),
    mimeType: z.string().trim().min(1),
    size: z.number().int().positive(),
  })
  .strict();

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = UploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.has(parsed.data.mimeType)) {
    return NextResponse.json({ error: 'unsupported_mime_type' }, { status: 415 });
  }
  if (parsed.data.size > MAX_SIZE) {
    return NextResponse.json({ error: 'file_too_large', maxSize: MAX_SIZE }, { status: 413 });
  }

  return NextResponse.json(
    { id: 'file-1001', status: 'uploaded', ...parsed.data },
    { status: 201 }
  );
}

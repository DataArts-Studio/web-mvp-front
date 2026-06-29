import { NextResponse } from 'next/server';

import { z } from 'zod';

export const dynamic = 'force-dynamic';

const POSTS = [
  { id: 701, title: 'QA 회고 공유', author: 'tester', deleted: false },
  { id: 702, title: '삭제된 게시글', author: 'admin', deleted: true },
];

const CreateSchema = z.object({ title: z.string().trim().min(2).max(80) }).strict();

export async function GET() {
  return NextResponse.json({
    total: POSTS.filter((post) => !post.deleted).length,
    data: POSTS.filter((post) => !post.deleted),
  });
}

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
  if (parsed.data.title.includes('금칙어')) {
    return NextResponse.json({ error: 'blocked_word' }, { status: 422 });
  }
  return NextResponse.json(
    { id: 9001, title: parsed.data.title, author: 'tester', deleted: false },
    { status: 201 }
  );
}

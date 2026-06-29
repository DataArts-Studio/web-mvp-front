import { NextResponse } from 'next/server';

import { z } from 'zod';

export const dynamic = 'force-dynamic';

const POSTS = [
  { id: 701, deleted: false },
  { id: 702, deleted: true },
];

const CommentSchema = z.object({ body: z.string().trim().min(1).max(300) }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'id는 숫자여야 합니다.' }, { status: 400 });
  }

  const post = POSTS.find((item) => item.id === Number(id));
  if (!post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (post.deleted) {
    return NextResponse.json({ error: 'deleted_post' }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = CommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력이 올바르지 않습니다.', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { id: 8001, postId: Number(id), body: parsed.data.body },
    { status: 201 }
  );
}

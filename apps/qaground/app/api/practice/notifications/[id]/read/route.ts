import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const IDS = new Set(['301', '302', '303']);

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'id는 숫자여야 합니다.' }, { status: 400 });
  }
  if (!IDS.has(id)) {
    return NextResponse.json({ error: '알림을 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json({
    id: Number(id),
    read: true,
    unreadCount: id === '301' || id === '302' ? 1 : 2,
  });
}

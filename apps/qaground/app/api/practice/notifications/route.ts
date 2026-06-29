import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const NOTIFICATIONS = [
  { id: 301, title: '새 댓글이 등록되었습니다', read: false, type: 'comment' },
  { id: 302, title: '예약이 확정되었습니다', read: false, type: 'reservation' },
  { id: 303, title: '리포트 생성이 완료되었습니다', read: true, type: 'report' },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const data = unreadOnly ? NOTIFICATIONS.filter((n) => !n.read) : NOTIFICATIONS;
  return NextResponse.json({ unreadCount: NOTIFICATIONS.filter((n) => !n.read).length, data });
}

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  if (auth !== 'Bearer qaground-admin-token') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }
  return NextResponse.json({ activeUsers: 128, failedJobs: 2, abuseReports: 3 });
}

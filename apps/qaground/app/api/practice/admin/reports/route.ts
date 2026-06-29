import { NextResponse } from 'next/server';

import { DEMO_TOKEN } from '@/shared/practice-api/auth';

export const dynamic = 'force-dynamic';

const ADMIN_TOKEN = 'qaground-admin-token';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  if (auth === `Bearer ${DEMO_TOKEN}`) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }
  if (auth !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }
  return NextResponse.json({ activeUsers: 128, failedJobs: 2, abuseReports: 3 });
}

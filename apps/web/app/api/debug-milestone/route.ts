import { NextResponse } from 'next/server';
import { getMilestoneById } from '@/features/milestones/api/get-milestone-by-id';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const milestoneId = url.searchParams.get('id') || '';

  try {
    const result = await getMilestoneById(milestoneId);
    return NextResponse.json({ result, resultType: typeof result, keys: result ? Object.keys(result) : [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack?.split('\n').slice(0, 5) }, { status: 500 });
  }
}

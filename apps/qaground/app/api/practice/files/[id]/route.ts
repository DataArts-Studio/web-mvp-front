import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FILES = new Map([
  [
    'file-1001',
    { id: 'file-1001', fileName: 'report.pdf', mimeType: 'application/pdf', size: 204800 },
  ],
]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = FILES.get(id);
  if (!file) {
    return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json(file);
}

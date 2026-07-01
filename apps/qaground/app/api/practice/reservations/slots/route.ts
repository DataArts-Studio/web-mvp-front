import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SLOTS = [
  { id: 'slot-0900', date: '2026-07-01', time: '09:00', capacity: 2, booked: 0 },
  { id: 'slot-1000', date: '2026-07-01', time: '10:00', capacity: 2, booked: 2 },
  { id: 'slot-1100', date: '2026-07-01', time: '11:00', capacity: 2, booked: 1 },
  { id: 'slot-0900-2', date: '2026-07-02', time: '09:00', capacity: 1, booked: 0 },
];

function isValidIsoDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === date;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  if (!date || !isValidIsoDate(date)) {
    return NextResponse.json(
      { error: 'date는 유효한 YYYY-MM-DD 형식이어야 합니다.' },
      { status: 400 }
    );
  }

  const data = SLOTS.filter((slot) => slot.date === date).map((slot) => ({
    ...slot,
    available: slot.capacity - slot.booked,
  }));
  return NextResponse.json({ date, data });
}

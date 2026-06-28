import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SLOTS = [
  { id: 'slot-0900', date: '2026-07-01', time: '09:00', capacity: 2, booked: 0 },
  { id: 'slot-1000', date: '2026-07-01', time: '10:00', capacity: 2, booked: 2 },
  { id: 'slot-1100', date: '2026-07-01', time: '11:00', capacity: 2, booked: 1 },
  { id: 'slot-0900-2', date: '2026-07-02', time: '09:00', capacity: 1, booked: 0 },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date는 YYYY-MM-DD 형식이어야 합니다.' }, { status: 400 });
  }

  const data = SLOTS.filter((slot) => slot.date === date).map((slot) => ({
    ...slot,
    available: slot.capacity - slot.booked,
  }));
  return NextResponse.json({ date, data });
}

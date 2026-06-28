import { NextResponse } from 'next/server';

import { TICKETS, type TicketPriority, type TicketStatus } from '@/shared/practice-api/data';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const StatusSchema = z.enum(['open', 'pending', 'resolved']);
const PrioritySchema = z.enum(['low', 'medium', 'high']);

const CreateSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    customerEmail: z.email(),
    priority: PrioritySchema.default('medium'),
    description: z.string().trim().max(1000).optional(),
  })
  .strict();

/**
 * GET /api/practice/tickets?page=1&limit=5&status=open&priority=high&assignee=support-a&q=로그인
 * - 페이지네이션 + 상태·우선순위·담당자 필터 + 제목/이메일 검색.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '5') || 5));
  const status = searchParams.get('status') as TicketStatus | null;
  const priority = searchParams.get('priority') as TicketPriority | null;
  const assignee = searchParams.get('assignee');
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();

  let filtered = TICKETS.slice();
  if (status && StatusSchema.safeParse(status).success) {
    filtered = filtered.filter((ticket) => ticket.status === status);
  }
  if (priority && PrioritySchema.safeParse(priority).success) {
    filtered = filtered.filter((ticket) => ticket.priority === priority);
  }
  if (assignee === 'unassigned') {
    filtered = filtered.filter((ticket) => ticket.assignee === null);
  } else if (assignee) {
    filtered = filtered.filter((ticket) => ticket.assignee === assignee);
  }
  if (q) {
    filtered = filtered.filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(q) || ticket.customerEmail.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const data = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ page, limit, total, totalPages, data });
}

/**
 * POST /api/practice/tickets
 * - 본문 검증 실패: 400 { error, issues }.
 * - 성공: 201 { id, title, customerEmail, status, priority, assignee, createdAt }.
 *   데모라 실제로 영속하지 않는다.
 */
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

  return NextResponse.json(
    {
      id: 9001,
      title: parsed.data.title,
      customerEmail: parsed.data.customerEmail,
      status: 'open',
      priority: parsed.data.priority,
      assignee: null,
      createdAt: '2026-06-28T00:00:00.000Z',
    },
    { status: 201 }
  );
}

'use client';

import { useState, useTransition } from 'react';

import Link from 'next/link';

import { deleteNoticeAction, toggleNoticeAction } from '@/features/notices/api/actions';
import { CATEGORY_LABELS, SEVERITY_LABELS } from '@/features/notices/model/validation';
import type { AdminAnnouncement, AnnouncementStatus } from '@testea/db';

const STATUS_LABEL: Record<AnnouncementStatus, string> = {
  scheduled: '예약',
  active: '활성',
  expired: '종료',
};

const STATUS_CLASS: Record<AnnouncementStatus, string> = {
  scheduled: 'bg-system-blue/15 text-system-blue',
  active: 'bg-primary/15 text-primary',
  expired: 'bg-bg-4 text-text-3',
};

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function NoticeRow({ item }: { item: AdminAnnouncement }) {
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isActive = item.status === 'active';

  return (
    <tr className="border-line-2 border-b last:border-0">
      <td className="px-3 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-text-1 font-medium">{item.title}</span>
          <div className="text-text-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span>{CATEGORY_LABELS[item.category] ?? item.category}</span>
            <span aria-hidden>·</span>
            <span>{SEVERITY_LABELS[item.severity] ?? item.severity}</span>
            {item.showAsPopup && (
              <span className="bg-bg-4 text-text-2 rounded-full px-1.5 py-0.5">팝업</span>
            )}
            {item.pinned && (
              <span className="bg-bg-4 text-text-2 rounded-full px-1.5 py-0.5">고정</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[item.status]}`}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </td>
      <td className="text-text-2 px-3 py-3 text-xs whitespace-nowrap">
        {formatDateTime(item.publishedAt)}
      </td>
      <td className="text-text-2 px-3 py-3 text-xs whitespace-nowrap">
        {formatDateTime(item.expiresAt)}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => toggleNoticeAction(item.id, !isActive))}
            className="border-line-2 text-text-2 hover:bg-bg-3 rounded-md border px-2.5 py-1 text-xs disabled:opacity-50"
          >
            {isActive ? '비활성화' : '활성화'}
          </button>
          <Link
            href={`/notices/${item.id}/edit`}
            className="border-line-2 text-text-2 hover:bg-bg-3 rounded-md border px-2.5 py-1 text-xs"
          >
            편집
          </Link>
          {confirmingDelete ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => deleteNoticeAction(item.id))}
              className="bg-system-red/15 text-system-red hover:bg-system-red/25 rounded-md px-2.5 py-1 text-xs disabled:opacity-50"
            >
              삭제 확인
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-text-3 hover:text-system-red rounded-md px-2.5 py-1 text-xs"
            >
              삭제
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function NoticesListView({ items }: { items: AdminAnnouncement[] }) {
  if (items.length === 0) {
    return (
      <div className="border-line-2 text-text-3 flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center">
        <p className="text-sm">등록된 공지가 없습니다.</p>
        <Link href="/notices/new" className="text-primary text-sm hover:underline">
          첫 공지 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="border-line-2 overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-bg-3 text-text-3 text-xs">
          <tr>
            <th className="px-3 py-2.5 font-medium">공지</th>
            <th className="px-3 py-2.5 font-medium">상태</th>
            <th className="px-3 py-2.5 font-medium">시작</th>
            <th className="px-3 py-2.5 font-medium">종료</th>
            <th className="px-3 py-2.5 text-right font-medium">액션</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <NoticeRow key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

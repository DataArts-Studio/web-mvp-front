'use client';

import { useEffect, useRef, useState } from 'react';

import type { AnnouncementWithReadState } from '@testea/db';
import { Bell } from 'lucide-react';

import { AnnouncementDetailDialog } from './announcement-detail-dialog';
import { useAnnouncementList, useUnreadCount } from './hooks';
import { CATEGORY_LABEL, SEVERITY_LABEL } from './labels';

/**
 * 헤더 우측 알림 벨 + 드롭다운 패널.
 *
 * - 벨: 미읽음 카운트 뱃지 (최대 99+).
 * - 드롭다운: 활성 공지 목록 (pinned 우선, 최신순). 항목 클릭 시 상세 모달.
 * - 외부 클릭/ESC 로 드롭다운 닫힘.
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState<AnnouncementWithReadState | null>(
    null
  );
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const { data: unread } = useUnreadCount();
  const list = useAnnouncementList(isOpen);

  // 바깥 클릭 / ESC 로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handlePointer = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const unreadCount = unread?.count ?? 0;
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);
  const items = list.data?.items ?? [];

  return (
    <>
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          aria-label={unreadCount > 0 ? `미읽음 공지 ${unreadCount}건` : '공지사항'}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-text-2 hover:text-primary relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="bg-system-red text-text-1 absolute -top-0.5 -right-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 py-px text-[10px] leading-none font-bold">
              {badgeLabel}
            </span>
          )}
        </button>

        {isOpen && (
          <div
            role="dialog"
            aria-label="공지사항"
            className="bg-bg-2 border-line-2 absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border shadow-xl sm:w-96"
          >
            <div className="border-line-2 flex items-center justify-between border-b px-4 py-3">
              <h2 className="typo-h3-heading text-text-1">공지사항</h2>
              {unreadCount > 0 && (
                <span className="typo-caption-normal text-text-3">미읽음 {unreadCount}</span>
              )}
            </div>
            <ul className="max-h-[60vh] divide-y divide-[color:var(--color-line-2)] overflow-y-auto">
              {list.isLoading && <SkeletonRow />}
              {!list.isLoading && items.length === 0 && (
                <li className="text-text-3 typo-body2-normal px-4 py-10 text-center">
                  새로운 공지가 없습니다.
                </li>
              )}
              {!list.isLoading &&
                items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAnnouncement(item);
                        setIsOpen(false);
                      }}
                      className="hover:bg-bg-3 flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {!item.readAt && (
                          <span
                            aria-label="미읽음"
                            className="bg-primary inline-block h-2 w-2 shrink-0 rounded-full"
                          />
                        )}
                        <span className="typo-caption-heading bg-bg-3 text-text-2 rounded-full px-2 py-0.5">
                          {CATEGORY_LABEL[item.category] ?? item.category}
                        </span>
                        {item.severity !== 'info' && (
                          <span
                            className={`typo-caption-heading rounded-full px-2 py-0.5 ${
                              item.severity === 'critical'
                                ? 'bg-system-red/15 text-system-red'
                                : 'bg-amber-500/15 text-amber-400'
                            }`}
                          >
                            {SEVERITY_LABEL[item.severity]}
                          </span>
                        )}
                      </span>
                      <span
                        className={`typo-body2-normal line-clamp-2 ${
                          item.readAt ? 'text-text-3' : 'text-text-1'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="typo-caption-normal text-text-4">
                        {formatRelative(item.publishedAt)}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      <AnnouncementDetailDialog
        announcement={activeAnnouncement}
        onClose={() => setActiveAnnouncement(null)}
      />
    </>
  );
}

function SkeletonRow() {
  return (
    <li className="px-4 py-4">
      <div className="bg-bg-3 mb-2 h-3 w-24 animate-pulse rounded" />
      <div className="bg-bg-3 mb-1 h-4 w-3/4 animate-pulse rounded" />
      <div className="bg-bg-3 h-3 w-16 animate-pulse rounded" />
    </li>
  );
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

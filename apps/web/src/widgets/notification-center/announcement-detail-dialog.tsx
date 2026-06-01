'use client';

import { useEffect } from 'react';

import type { AnnouncementWithReadState } from '@testea/db';
import { DSButton, Dialog } from '@testea/ui';

import { useMarkRead } from './hooks';
import { useAnnouncementLabels } from './labels';

interface AnnouncementDetailDialogProps {
  announcement: AnnouncementWithReadState | null;
  onClose: () => void;
}

/**
 * 공지 상세 모달. 열리는 시점에 읽음 처리 mutation 을 호출한다 (멱등).
 * Dialog primitive 의 style prop 회귀 이슈가 있어 기본값을 명시 (feedback_dialog_primitive_style_bug).
 */
export function AnnouncementDetailDialog({ announcement, onClose }: AnnouncementDetailDialogProps) {
  const markRead = useMarkRead();
  const labels = useAnnouncementLabels();

  useEffect(() => {
    if (!announcement) return;
    if (announcement.readAt) return;
    markRead.mutate(announcement.id);
    // mutate 는 안정 참조라 dep 에 넣지 않아도 동일 효과지만 lint 회피용으로 포함
  }, [announcement?.id, announcement?.readAt, markRead, announcement]);

  if (!announcement) return null;

  return (
    <Dialog.Root defaultOpen={true} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="animate-in fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1010,
          }}
        />
        <Dialog.Content
          className="bg-bg-2 w-full max-w-lg rounded-2xl p-6 shadow-2xl"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1011,
            outline: 'none',
          }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="bg-primary/15 text-primary typo-caption-heading rounded-full px-2.5 py-0.5">
                {labels.category(announcement.category)}
              </span>
              <span
                className={`typo-caption-heading rounded-full px-2.5 py-0.5 ${severityClass(
                  announcement.severity
                )}`}
              >
                {labels.severity(announcement.severity)}
              </span>
              <time
                dateTime={announcement.publishedAt}
                className="typo-caption-normal text-text-4 ml-auto"
              >
                {formatDate(announcement.publishedAt)}
              </time>
            </div>

            <Dialog.Title className="typo-h2-heading text-text-1">
              {announcement.title}
            </Dialog.Title>

            <Dialog.Description className="sr-only">공지사항 상세</Dialog.Description>

            <div className="typo-body2-normal text-text-2 max-h-[60vh] overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {announcement.body}
            </div>

            <DSButton variant="solid" size="medium" className="mt-2 w-full" onClick={onClose}>
              닫기
            </DSButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function severityClass(severity: AnnouncementWithReadState['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-system-red/15 text-system-red';
    case 'warning':
      return 'bg-amber-500/15 text-amber-400';
    case 'info':
    default:
      return 'bg-bg-3 text-text-2';
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

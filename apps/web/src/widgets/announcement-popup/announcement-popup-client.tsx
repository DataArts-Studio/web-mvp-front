'use client';

import { DSButton, Dialog } from '@testea/ui';

import { usePopupDismiss } from './use-popup-dismiss';

interface AnnouncementPopupClientProps {
  /** 노출할 공지 id (dismiss 상태와 짝지음) */
  announcementId: string;
  /** 좌측 라벨 (카테고리) */
  label: string;
  title: string;
  body: string;
}

/**
 * 활성 popup 공지를 첫 진입 시 모달로 노출한다. 닫으면 id 단위로 영구 숨김(localStorage).
 * 렌더 데이터는 서버 컴포넌트(`AnnouncementPopup`)가 DB 에서 가져와 전달한다.
 */
export function AnnouncementPopupClient({
  announcementId,
  label,
  title,
  body,
}: AnnouncementPopupClientProps) {
  const { isVisible, dismiss } = usePopupDismiss(announcementId);

  if (!isVisible) return null;

  return (
    <Dialog.Root defaultOpen onOpenChange={(open) => !open && dismiss()}>
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
          className="bg-bg-2 w-full max-w-md rounded-2xl p-6 shadow-2xl"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1011,
            outline: 'none',
          }}
        >
          <div className="flex flex-col gap-5">
            <span className="bg-primary/15 text-primary w-fit rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase">
              {label}
            </span>

            <Dialog.Title className="text-text-1 text-lg font-bold">{title}</Dialog.Title>

            <Dialog.Description className="text-text-2 text-sm leading-relaxed whitespace-pre-line">
              {body}
            </Dialog.Description>

            <DSButton variant="solid" size="medium" className="mt-1 w-full" onClick={dismiss}>
              확인
            </DSButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

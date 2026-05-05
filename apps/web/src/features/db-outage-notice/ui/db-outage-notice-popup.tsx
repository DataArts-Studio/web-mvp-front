'use client';

import { Dialog } from '@testea/ui';
import { DSButton } from '@testea/ui';
import { useDbOutageNotice } from '../hooks/use-db-outage-notice';

export const DbOutageNoticePopup = () => {
  const { isVisible, dismiss } = useDbOutageNotice();

  if (!isVisible) return null;

  return (
    <Dialog.Root defaultOpen={true}>
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
          className="w-full max-w-md rounded-2xl bg-bg-2 p-6 shadow-2xl"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1011,
            outline: 'none',
          }}
        >
          <div className="flex flex-col items-center gap-5 text-center">
            <span className="rounded-full bg-danger/15 px-4 py-1.5 text-xs font-bold tracking-wider uppercase text-danger">
              Notice
            </span>

            <Dialog.Title className="text-lg font-bold text-text-1">
              서비스 이용 불편 안내
            </Dialog.Title>

            <Dialog.Description className="sr-only">
              DB 장애 복구 및 서비스 정상화 안내
            </Dialog.Description>

            <div className="flex flex-col gap-3 text-sm leading-relaxed text-text-2">
              <p>DB 장애로 인해 일시적으로 서비스 접속이 원활하지 않았던 점 깊이 사과드립니다. 현재는 수정이 완료되어 정상적으로 이용하실 수 있습니다.</p>
              <p>이용에 불편을 드려 죄송합니다.</p>
            </div>

            <DSButton
              variant="solid"
              size="medium"
              className="mt-1 w-full"
              onClick={dismiss}
            >
              확인
            </DSButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

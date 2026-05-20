'use client';

import { Dialog } from '@testea/ui';
import { DSButton } from '@testea/ui';

import { useBetaNotice } from '../hooks/use-beta-notice';

export const BetaNoticePopup = () => {
  const { isVisible, dismiss } = useBetaNotice();

  if (!isVisible) return null;

  return (
    <Dialog.Root defaultOpen={true}>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-in fade-in" />
        <Dialog.Content className="bg-bg-2 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col items-center gap-5 text-center">
            {/* Beta Badge */}
            <span className="bg-primary/15 text-primary rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase">
              Beta
            </span>

            {/* Title */}
            <Dialog.Title className="text-text-1 text-lg font-bold">
              Testea 베타 버전 안내
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="sr-only">
              베타 버전 안내 및 모바일 미지원 공지
            </Dialog.Description>

            {/* Notice Text */}
            <div className="text-text-2 flex flex-col gap-2 text-sm leading-relaxed">
              <p>본 서비스는 현재 베타 버전으로 운영되고 있으며,</p>
              <p>일부 기능이 정상적으로 동작하지 않을 수 있습니다.</p>
              <div className="bg-text-2/20 my-1 h-px w-12 self-center" />
              <p>현재 모바일 환경은 지원되지 않습니다.</p>
              <p>데스크톱 브라우저에서 이용해 주시기 바랍니다.</p>
              <div className="bg-text-2/20 my-1 h-px w-12 self-center" />
              <p className="text-text-1 font-medium">베타 이용 제한</p>
              <p>프로젝트: 최대 1개</p>
              <p>저장 용량: 프로젝트당 최대 20MB</p>
            </div>

            {/* Confirm Button */}
            <DSButton variant="solid" size="medium" className="mt-1 w-full" onClick={dismiss}>
              확인
            </DSButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

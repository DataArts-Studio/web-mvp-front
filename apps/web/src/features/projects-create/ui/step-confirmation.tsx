'use client';

import { useRef, useState } from 'react';

import { DSButton, LoadingSpinner } from '@/shared';
import { ENV } from '@/shared/constants';
import { PROJECT_CREATE_EVENTS, track } from '@/shared/lib/analytics';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { FolderOpen } from 'lucide-react';

interface StepConfirmationProps {
  projectName: string;
  step: number;
  isSubmitting: boolean;
  siteKey: string;
  onTurnstileToken: (token: string) => void;
  turnstileToken: string;
  onClose?: () => void;
}

export const StepConfirmation = ({
  projectName,
  step,
  isSubmitting,
  siteKey,
  onTurnstileToken,
  turnstileToken,
  onClose,
}: StepConfirmationProps) => {
  const turnstileRef = useRef<TurnstileInstance>(null);

  return (
    <div className="relative flex w-full flex-col items-center gap-6">
      {isSubmitting && (
        <div className="bg-bg-1/80 absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-sm">
          <LoadingSpinner size="md" text="프로젝트를 생성하고 있어요" />
        </div>
      )}
      <div className="bg-primary/15 flex h-14 w-14 items-center justify-center rounded-full">
        <FolderOpen className="text-primary h-7 w-7" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-text-1 text-xl font-bold">프로젝트를 생성하시겠습니까?</h2>
        <p className="text-text-3 text-sm">아래 정보로 새 프로젝트가 생성됩니다.</p>
      </div>
      <div className="border-line-2 bg-bg-2 flex w-full items-center gap-3 rounded-xl border px-5 py-4">
        <div className="bg-bg-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <FolderOpen className="text-primary h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-text-3 text-xs">프로젝트 이름</p>
          <p className="text-text-1 truncate text-base font-semibold">{projectName}</p>
        </div>
      </div>
      {siteKey && (
        <Turnstile
          ref={turnstileRef}
          siteKey={siteKey}
          onSuccess={onTurnstileToken}
          onError={() => onTurnstileToken('')}
          onExpire={() => onTurnstileToken('')}
          options={{ theme: 'dark', size: 'flexible' }}
        />
      )}
      <div className="flex w-full gap-3">
        <DSButton
          onClick={() => {
            track(PROJECT_CREATE_EVENTS.ABANDON, { step });
            onClose?.();
          }}
          type="button"
          variant="ghost"
          className="w-full"
          disabled={isSubmitting}
        >
          취소
        </DSButton>
        <DSButton
          type="submit"
          variant="solid"
          className="w-full"
          disabled={isSubmitting || (!!siteKey && !turnstileToken)}
        >
          생성하기
        </DSButton>
      </div>
    </div>
  );
};

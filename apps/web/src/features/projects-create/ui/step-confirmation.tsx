'use client';

import { useRef, useState } from 'react';

import { DSButton, LoadingSpinner } from '@/shared';
import { ENV } from '@/shared/constants';
import { track, PROJECT_CREATE_EVENTS } from '@/shared/lib/analytics';
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
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-bg-1/80 backdrop-blur-sm">
          <LoadingSpinner size="md" text="프로젝트를 생성하고 있어요" />
        </div>
      )}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
        <FolderOpen className="h-7 w-7 text-primary" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold text-text-1">프로젝트를 생성하시겠습니까?</h2>
        <p className="text-sm text-text-3">아래 정보로 새 프로젝트가 생성됩니다.</p>
      </div>
      <div className="flex w-full items-center gap-3 rounded-xl border border-line-2 bg-bg-2 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-3">
          <FolderOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-3">프로젝트 이름</p>
          <p className="truncate text-base font-semibold text-text-1">{projectName}</p>
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
        <DSButton onClick={() => { track(PROJECT_CREATE_EVENTS.ABANDON, { step }); onClose?.(); }} type="button" variant="ghost" className="w-full" disabled={isSubmitting}>
          취소
        </DSButton>
        <DSButton type="submit" variant="solid" className="w-full" disabled={isSubmitting || (!!siteKey && !turnstileToken)}>
          생성하기
        </DSButton>
      </div>
    </div>
  );
};

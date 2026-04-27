'use client';

import { useEffect, useState } from 'react';

import { DSButton } from '@/shared';
import { track, PROJECT_CREATE_EVENTS } from '@/shared/lib/analytics';
import { CheckCircle, ClipboardCheck, Copy } from 'lucide-react';

interface StepSuccessProps {
  createdSlug: string;
  onStart: () => void;
}

export const StepSuccess = ({ createdSlug, onStart }: StepSuccessProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/projects/${encodeURIComponent(createdSlug)}`;
    navigator.clipboard.writeText(link).then(() => {
      track(PROJECT_CREATE_EVENTS.LINK_COPY);
      setCopied(true);
    });
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (copied) {
      timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
        <CheckCircle className="h-7 w-7 text-primary" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold text-text-1">프로젝트 생성 완료!</h2>
        <p className="text-sm text-text-3">프로젝트가 성공적으로 생성되었습니다.</p>
      </div>
      <div className="flex w-full items-center gap-2 rounded-xl border border-line-2 bg-bg-2 px-4 py-3">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-2">
          {createdSlug}
        </p>
        <DSButton type="button" variant="ghost" size="small" onClick={handleCopyLink} className="shrink-0 gap-1.5">
          {copied ? <><ClipboardCheck className="h-4 w-4" /> 복사 완료</> : <><Copy className="h-4 w-4" /> 링크 복사</>}
        </DSButton>
      </div>
      <DSButton
        variant="solid"
        className="w-full"
        onClick={onStart}
      >
        시작하기
      </DSButton>
    </div>
  );
};

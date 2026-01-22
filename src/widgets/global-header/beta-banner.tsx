'use client';

import React from 'react';

interface BetaBannerProps {
  isVisible: boolean;
  onDismiss: () => void;
}

const STORAGE_KEY = 'beta-banner-dismissed-v1';

export const BetaBanner = ({ isVisible, onDismiss }: BetaBannerProps) => {
  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    onDismiss();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="베타 버전 안내"
      className="fixed top-0 right-0 left-0 z-20 flex h-10 items-center justify-center gap-3 border-b border-line-2 bg-bg-3 px-4"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-2 bg-primary/20 px-2 py-0.5 text-caption font-medium text-primary">
          Beta
        </span>
        <p className="text-label text-text-2">
          현재 베타 버전입니다. 서비스 이용 중 불편한 점이나 개선 의견이 있으시면{' '}
          <a
            href="mailto:contact@testea.com"
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            피드백
          </a>
          을 보내주세요.
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="베타 안내 닫기"
        className="ml-2 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-2 text-text-3 transition-colors hover:bg-bg-4 hover:text-text-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

'use client';

import React, { useState } from 'react';

import { Share2 } from 'lucide-react';

import { ShareModal } from './share-modal';

interface ShareButtonProps {
  testRunId: string;
  shareToken: string | null;
  shareExpiresAt: Date | null;
  /** text: 테두리 있는 "공유" 버튼 (리뉴얼 v2 실행 화면). 기본은 아이콘만. */
  variant?: 'icon' | 'text';
}

export const ShareButton = ({
  testRunId,
  shareToken,
  shareExpiresAt,
  variant = 'icon',
}: ShareButtonProps) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {variant === 'text' ? (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-[6px] border border-white/[0.17] px-3.5 py-[7px] text-[13px] font-medium whitespace-nowrap text-white/85 transition-colors hover:border-white/35"
          aria-label="공유 링크 관리"
        >
          공유
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="text-text-3 hover:text-text-1 flex items-center gap-1 text-sm transition-colors"
          aria-label="공유 링크 관리"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      {showModal && (
        <ShareModal
          testRunId={testRunId}
          shareToken={shareToken}
          shareExpiresAt={shareExpiresAt}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

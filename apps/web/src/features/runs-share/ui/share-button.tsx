'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from './share-modal';

interface ShareButtonProps {
  testRunId: string;
  shareToken: string | null;
  shareExpiresAt: Date | null;
}

export const ShareButton = ({ testRunId, shareToken, shareExpiresAt }: ShareButtonProps) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-text-3 hover:text-text-1 flex items-center gap-1 text-sm transition-colors"
        aria-label="공유 링크 관리"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
      </button>

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

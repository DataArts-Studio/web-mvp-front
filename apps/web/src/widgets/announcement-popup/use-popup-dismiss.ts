'use client';

import { useEffect, useState } from 'react';

/**
 * 공지 팝업을 영구히(브라우저 단위) 닫는다. 배너의 세션 한정 dismiss 와 달리 localStorage 사용.
 * 공지 id 별 key 라서 새 팝업 공지가 발행되면 다시 노출된다 (FDD-BO03 사용자 측 표시 규칙).
 *
 * 마운트 전(SSR + 첫 클라이언트 렌더)에는 숨겨 모달 flash·하이드레이션 불일치를 피하고,
 * 마운트 후 localStorage 를 읽어 미닫힘이면 노출한다.
 */
const STORAGE_PREFIX = 'announcement-popup-dismissed:';

function storageKey(announcementId: string): string {
  return `${STORAGE_PREFIX}${announcementId}`;
}

export function usePopupDismiss(announcementId: string) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration: read localStorage and sync state
    setMounted(true);
    setDismissed(localStorage.getItem(storageKey(announcementId)) !== null);
  }, [announcementId]);

  const dismiss = () => {
    localStorage.setItem(storageKey(announcementId), '1');
    setDismissed(true);
  };

  return { isVisible: mounted && !dismissed, dismiss };
}

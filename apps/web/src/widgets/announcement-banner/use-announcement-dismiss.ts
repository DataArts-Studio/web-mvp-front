'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * 세션 동안만 배너를 숨긴다. 영구 숨김 아님 (FDD-NT01).
 * 공지 id 별로 sessionStorage key 를 둬서 다른 공지가 새로 뜨면 다시 노출되도록 한다.
 */
const STORAGE_PREFIX = 'announcement-dismissed:';

let listeners: Array<() => void> = [];

function storageKey(announcementId: string): string {
  return `${STORAGE_PREFIX}${announcementId}`;
}

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function useAnnouncementDismiss(announcementId: string) {
  const isVisible = useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(storageKey(announcementId)) === null,
    () => true
  );

  const dismiss = useCallback(() => {
    sessionStorage.setItem(storageKey(announcementId), '1');
    emitChange();
  }, [announcementId]);

  return { isVisible, dismiss };
}

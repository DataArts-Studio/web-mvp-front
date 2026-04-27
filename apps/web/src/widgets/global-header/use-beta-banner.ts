'use client';

import { useSyncExternalStore, useCallback } from 'react';

const STORAGE_KEY = 'beta-banner-dismissed-v1';

let listeners: Array<() => void> = [];

function getSnapshot(): boolean {
  return !sessionStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const useBetaBanner = () => {
  const isVisible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    emitChange();
  }, []);

  return { isVisible, dismiss };
};

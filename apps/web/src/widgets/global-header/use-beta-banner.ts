'use client';

import { useCallback, useSyncExternalStore } from 'react';

import {
  BETA_BANNER_DISMISSED_ATTR,
  BETA_BANNER_STORAGE_KEY,
} from '@/widgets/global-header/beta-banner-storage';

let listeners: Array<() => void> = [];

function getSnapshot(): boolean {
  return !sessionStorage.getItem(BETA_BANNER_STORAGE_KEY);
}

// 서버 렌더에서도 배너를 보여 첫 화면부터 배너 자리를 잡는다. 숨김으로 렌더하면 hydration 뒤
// 배너가 나타나며 헤더를 40px 밀어 첫 클릭이 배너에 떨어진다 (#438).
function getServerSnapshot(): boolean {
  return true;
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

export const useBetaBanner = () => {
  const isVisible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(BETA_BANNER_STORAGE_KEY, 'true');
    document.documentElement.setAttribute(BETA_BANNER_DISMISSED_ATTR, '');
    emitChange();
  }, []);

  return { isVisible, dismiss };
};

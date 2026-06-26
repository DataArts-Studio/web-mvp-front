'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * localStorage 값을 SSR 안전하게 읽고 쓰는 훅.
 *
 * - 서버 스냅샷은 null 이라 하이드레이션 불일치가 없다(마운트 후 실제 값으로 갱신).
 * - 같은 탭 내 쓰기는 커스텀 이벤트로, 다른 탭 변경은 storage 이벤트로 반영된다.
 * - useEffect 안 setState 패턴을 피하므로 react-hooks 규칙에도 맞다.
 */
const STORE_EVENT = 'qaground:local-store';

export function useLocalStorage(key: string): [string | null, (value: string | null) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener('storage', onChange);
    window.addEventListener(STORE_EVENT, onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener(STORE_EVENT, onChange);
    };
  }, []);

  const value = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null
  );

  const setValue = useCallback(
    (next: string | null) => {
      if (next === null) localStorage.removeItem(key);
      else localStorage.setItem(key, next);
      window.dispatchEvent(new Event(STORE_EVENT));
    },
    [key]
  );

  return [value, setValue];
}
